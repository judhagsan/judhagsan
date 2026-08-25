import orchestrator from "tests/orchestrator.js";
import webserver from "infra/webserver.js";

/*
 * Este endpoint lê a base inteira, então cada teste precisa de um banco só
 * seu: um usuário deixado para trás por outro teste mudaria o `total` e a
 * ordem da listagem. Daí o clear por teste, e não só uma vez no arquivo.
 */
beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

beforeEach(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

async function createAdmin() {
  const createdUser = await orchestrator.createUser();
  const activatedUser = await orchestrator.activateUser(createdUser);
  await orchestrator.addFeaturesToUser(activatedUser, ["read:user:all"]);
  const sessionObject = await orchestrator.createSession(activatedUser);

  return { createdUser, sessionObject };
}

function listUsers({ sessionToken, query = "" } = {}) {
  return fetch(`${webserver.origin}/api/v1/users${query}`, {
    headers: sessionToken ? { Cookie: `session_id=${sessionToken}` } : {},
  });
}

describe("GET /api/v1/users", () => {
  describe("Anonymous user", () => {
    test("Without session", async () => {
      const response = await listUsers();

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar esta ação.",
        action: 'Verifique se o seu usuário possui a feature "read:user:all"',
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test("Without `read:user:all`", async () => {
      const createdUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const response = await listUsers({ sessionToken: sessionObject.token });

      expect(response.status).toBe(403);
    });
  });

  describe("User with `read:user:all`", () => {
    test("Lists every registered user", async () => {
      const { createdUser, sessionObject } = await createAdmin();
      const otherUser = await orchestrator.createUser();

      const response = await listUsers({ sessionToken: sessionObject.token });

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody.total).toBe(2);
      expect(responseBody.limit).toBe(50);
      expect(responseBody.offset).toBe(0);
      expect(responseBody.users).toHaveLength(2);

      const usernames = responseBody.users.map((each) => each.username);
      expect(usernames).toContain(createdUser.username);
      expect(usernames).toContain(otherUser.username);
    });

    test("Returns only the fields the panel needs", async () => {
      const { sessionObject } = await createAdmin();

      const response = await listUsers({ sessionToken: sessionObject.token });
      const responseBody = await response.json();

      expect(Object.keys(responseBody.users[0]).sort()).toEqual([
        "created_at",
        "email",
        "features",
        "id",
        "updated_at",
        "username",
      ]);
    });

    // A listagem administrativa é o lugar mais fácil de vazar hash de senha
    // sem ninguém notar: são muitos usuários numa resposta só.
    test("Never returns `password`", async () => {
      const { sessionObject } = await createAdmin();
      await orchestrator.createUser({ password: "senhaSecreta123" });

      const response = await listUsers({ sessionToken: sessionObject.token });
      const responseBody = await response.json();

      for (const userFound of responseBody.users) {
        expect(userFound).not.toHaveProperty("password");
      }
      expect(JSON.stringify(responseBody)).not.toContain("senhaSecreta123");
      expect(JSON.stringify(responseBody)).not.toContain("$2a$");
    });

    test("Lists the newest user first", async () => {
      const { sessionObject } = await createAdmin();
      const newestUser = await orchestrator.createUser();

      const response = await listUsers({ sessionToken: sessionObject.token });
      const responseBody = await response.json();

      expect(responseBody.users[0].username).toBe(newestUser.username);
    });

    test("With `limit` and `offset`", async () => {
      const { sessionObject } = await createAdmin();
      await orchestrator.createUser();
      await orchestrator.createUser();

      const firstPage = await listUsers({
        sessionToken: sessionObject.token,
        query: "?limit=2&offset=0",
      });
      const firstPageBody = await firstPage.json();

      expect(firstPageBody.total).toBe(3);
      expect(firstPageBody.limit).toBe(2);
      expect(firstPageBody.users).toHaveLength(2);

      const secondPage = await listUsers({
        sessionToken: sessionObject.token,
        query: "?limit=2&offset=2",
      });
      const secondPageBody = await secondPage.json();

      expect(secondPageBody.total).toBe(3);
      expect(secondPageBody.offset).toBe(2);
      expect(secondPageBody.users).toHaveLength(1);

      // Páginas sem interseção: o offset move mesmo, não repete o começo.
      const firstIds = firstPageBody.users.map((each) => each.id);
      expect(firstIds).not.toContain(secondPageBody.users[0].id);
    });

    // Um `limit` absurdo vindo da query não pode virar um SELECT sem teto.
    test("Clamps an out-of-range `limit`", async () => {
      const { sessionObject } = await createAdmin();

      const tooHigh = await listUsers({
        sessionToken: sessionObject.token,
        query: "?limit=99999",
      });
      expect((await tooHigh.json()).limit).toBe(200);

      const notANumber = await listUsers({
        sessionToken: sessionObject.token,
        query: "?limit=abc",
      });
      expect((await notANumber.json()).limit).toBe(50);

      const negative = await listUsers({
        sessionToken: sessionObject.token,
        query: "?limit=-5&offset=-10",
      });
      const negativeBody = await negative.json();
      expect(negativeBody.limit).toBe(50);
      expect(negativeBody.offset).toBe(0);
    });
  });
});
