import orchestrator from "tests/orchestrator.js";
import user from "models/user.js";
import supporter from "models/supporter.js";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

async function createManager() {
  const createdUser = await orchestrator.createUser();
  const activatedUser = await orchestrator.activateUser(createdUser);
  await orchestrator.addFeaturesToUser(activatedUser, ["manage:supporter"]);
  const sessionObject = await orchestrator.createSession(activatedUser);

  return sessionObject;
}

async function createTarget() {
  const createdUser = await orchestrator.createUser();
  return await orchestrator.activateUser(createdUser);
}

function callSupporter({ username, method, sessionToken }) {
  return fetch(`${webserver.origin}/api/v1/users/${username}/supporter`, {
    method,
    headers: sessionToken ? { Cookie: `session_id=${sessionToken}` } : {},
  });
}

describe("PUT/DELETE /api/v1/users/[username]/supporter", () => {
  describe("Anonymous user", () => {
    test("Without session", async () => {
      const targetUser = await createTarget();

      const response = await callSupporter({
        username: targetUser.username,
        method: "PUT",
      });

      expect(response.status).toBe(403);

      const userInDatabase = await user.findOneById(targetUser.id);
      expect(userInDatabase.features).not.toContain("apoiador");
    });
  });

  describe("Default user", () => {
    // O caso que mais importa: sem `manage:supporter`, ninguém se promove a
    // apoiador sozinho — nem na própria conta.
    test("Cannot grant support to themselves", async () => {
      const createdUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const response = await callSupporter({
        username: activatedUser.username,
        method: "PUT",
        sessionToken: sessionObject.token,
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar esta ação.",
        action:
          'Verifique se o seu usuário possui a feature "manage:supporter"',
        status_code: 403,
      });

      const userInDatabase = await user.findOneById(activatedUser.id);
      expect(userInDatabase.features).not.toContain("apoiador");
    });
  });

  describe("User with `manage:supporter`", () => {
    test("Grants support", async () => {
      const sessionObject = await createManager();
      const targetUser = await createTarget();

      const response = await callSupporter({
        username: targetUser.username,
        method: "PUT",
        sessionToken: sessionObject.token,
      });

      expect(response.status).toBe(200);

      // A resposta é a visão pública do usuário — sem `features`, que é o
      // mapa de privilégios. Quem confere se a concessão pegou é o banco,
      // logo abaixo; o card do painel relê a lista em vez de usar isto.
      const responseBody = await response.json();
      expect(responseBody.username).toBe(targetUser.username);
      expect(responseBody).not.toHaveProperty("features");
      expect(responseBody).not.toHaveProperty("password");

      const userInDatabase = await user.findOneById(targetUser.id);
      expect(userInDatabase.features).toContain("apoiador");
    });

    test("Granting twice does not duplicate the feature", async () => {
      const sessionObject = await createManager();
      const targetUser = await createTarget();

      await callSupporter({
        username: targetUser.username,
        method: "PUT",
        sessionToken: sessionObject.token,
      });
      const response = await callSupporter({
        username: targetUser.username,
        method: "PUT",
        sessionToken: sessionObject.token,
      });

      expect(response.status).toBe(200);

      const userInDatabase = await user.findOneById(targetUser.id);
      const occurrences = userInDatabase.features.filter(
        (feature) => feature === "apoiador",
      );
      expect(occurrences).toHaveLength(1);
    });

    test("Revokes a manually granted support", async () => {
      const sessionObject = await createManager();
      const targetUser = await createTarget();
      await supporter.grant(targetUser.id);

      const response = await callSupporter({
        username: targetUser.username,
        method: "DELETE",
        sessionToken: sessionObject.token,
      });

      expect(response.status).toBe(200);

      const userInDatabase = await user.findOneById(targetUser.id);
      expect(userInDatabase.features).not.toContain("apoiador");
    });

    /*
     * Tirar a feature não cancela a assinatura no Mercado Pago: a cobrança
     * seguiria, o próximo webhook devolveria o acesso, e no meio disso alguém
     * que paga teria ficado sem. Por isso o botão do painel não age sobre um
     * ciclo pago em andamento.
     */
    test("Refuses to revoke while a paid cycle is running", async () => {
      const sessionObject = await createManager();
      const targetUser = await createTarget();

      const until = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);
      await supporter.grantUntil(targetUser.id, until);

      const response = await callSupporter({
        username: targetUser.username,
        method: "DELETE",
        sessionToken: sessionObject.token,
      });

      expect(response.status).toBe(400);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "Esta conta tem um ciclo de apoio pago em andamento.",
        action:
          "O cancelamento precisa partir da própria pessoa, em /sessao, para encerrar a cobrança.",
        status_code: 400,
      });

      const userInDatabase = await user.findOneById(targetUser.id);
      expect(userInDatabase.features).toContain("apoiador");
    });

    // Prazo vencido é apoio que já acabou: o cron ainda não passou, mas não há
    // ciclo pago a honrar, então a revogação manual pode agir.
    test("Revokes when the paid cycle has already expired", async () => {
      const sessionObject = await createManager();
      const targetUser = await createTarget();

      const past = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await supporter.grantUntil(targetUser.id, past);

      const response = await callSupporter({
        username: targetUser.username,
        method: "DELETE",
        sessionToken: sessionObject.token,
      });

      expect(response.status).toBe(200);

      const userInDatabase = await user.findOneById(targetUser.id);
      expect(userInDatabase.features).not.toContain("apoiador");
    });

    test("With nonexistent `username`", async () => {
      const sessionObject = await createManager();

      const response = await callSupporter({
        username: "UsuarioInexistente",
        method: "PUT",
        sessionToken: sessionObject.token,
      });

      expect(response.status).toBe(404);
    });
  });
});
