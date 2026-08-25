import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

async function createLoggedUser() {
  const createdUser = await orchestrator.createUser();
  const activatedUser = await orchestrator.activateUser(createdUser);
  return await orchestrator.createSession(activatedUser);
}

function getUser(username, sessionToken) {
  return fetch(`${webserver.origin}/api/v1/users/${username}`, {
    headers: sessionToken ? { Cookie: `session_id=${sessionToken}` } : {},
  });
}

describe("GET /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    // Sem sessão a rota não responde nada sobre a conta — nem que ela existe.
    // Antes, 200 contra 404 já entregava a lista de quem está cadastrado.
    test("Cannot look up an existing user", async () => {
      const createdUser = await orchestrator.createUser();

      const response = await getUser(createdUser.username);

      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody.name).toBe("ForbiddenError");
      expect(JSON.stringify(responseBody)).not.toContain(createdUser.username);
    });

    // A mesma resposta para quem existe e para quem não existe: é isso que
    // fecha a enumeração de usernames.
    test("Gets the same answer for a nonexistent user", async () => {
      const response = await getUser("UsuarioInexistente");

      expect(response.status).toBe(403);
    });
  });

  describe("Default user", () => {
    test("With exact case match", async () => {
      const sessionObject = await createLoggedUser();
      await orchestrator.createUser({ username: "MesmoCase" });

      const response = await getUser("MesmoCase", sessionObject.token);

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "MesmoCase",
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test("With case mismatch", async () => {
      const sessionObject = await createLoggedUser();
      await orchestrator.createUser({ username: "CaseDiferente" });

      const response = await getUser("casediferente", sessionObject.token);

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody.username).toBe("CaseDiferente");
    });

    /*
     * `features` é o mapa de privilégios da conta. Exposto aqui, dizia a
     * qualquer um qual username tem `admin` ou `manage:supporter` — o passo
     * anterior a mirar numa conta específica. Quem precisa da lista tem ramo
     * próprio: `read:user:self` para a própria conta, `read:user:all` para o
     * painel.
     */
    test("Never returns `features` or `email` of another user", async () => {
      const sessionObject = await createLoggedUser();
      const target = await orchestrator.createUser();
      const activatedTarget = await orchestrator.activateUser(target);
      await orchestrator.addFeaturesToUser(activatedTarget, ["admin"]);

      const response = await getUser(target.username, sessionObject.token);
      const responseBody = await response.json();

      expect(responseBody).not.toHaveProperty("features");
      expect(responseBody).not.toHaveProperty("email");
      expect(responseBody).not.toHaveProperty("password");
      expect(JSON.stringify(responseBody)).not.toContain("admin");
    });

    test("With nonexistent username", async () => {
      const sessionObject = await createLoggedUser();

      const response = await getUser("UsuarioInexistente", sessionObject.token);

      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "O username informado não foi encontrado no sistema.",
        action: "Verifique se o username está digitado corretamente.",
        status_code: 404,
      });
    });
  });
});
