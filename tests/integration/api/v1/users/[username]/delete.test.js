import orchestrator from "tests/orchestrator.js";
import user from "models/user.js";
import session from "models/session.js";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("DELETE /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("Cannot delete any user", async () => {
      const targetUser = await orchestrator.createUser({
        username: "anonymouscannotdelete",
      });
      await orchestrator.activateUser(targetUser);

      const response = await fetch(
        `${webserver.origin}/api/v1/users/${targetUser.username}`,
        { method: "DELETE" },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar esta ação.",
        action: 'Verifique se o seu usuário possui a feature "delete:user"',
        status_code: 403,
      });

      const stillExists = await user.findOneByUsername(targetUser.username);
      expect(stillExists.id).toBe(targetUser.id);
    });
  });

  describe("Default user", () => {
    test("Can self-delete and gets session cookie cleared", async () => {
      const ownUser = await orchestrator.createUser({
        username: "selfdeleteuser",
      });
      await orchestrator.activateUser(ownUser);
      const ownSession = await orchestrator.createSession(ownUser);

      const response = await fetch(
        `${webserver.origin}/api/v1/users/${ownUser.username}`,
        {
          method: "DELETE",
          headers: { Cookie: `session_id=${ownSession.token}` },
        },
      );

      expect(response.status).toBe(204);

      const setCookie = response.headers.get("set-cookie");
      expect(setCookie).toContain("session_id=invalid");

      await expect(user.findOneByUsername(ownUser.username)).rejects.toThrow(
        "O username informado não foi encontrado no sistema.",
      );

      await expect(
        session.findOneValidByToken(ownSession.token),
      ).rejects.toThrow("Usuário não possui sessão ativa.");
    });

    test("Cannot delete another user", async () => {
      const ownUser = await orchestrator.createUser({
        username: "cannotdeleteothers",
      });
      await orchestrator.activateUser(ownUser);
      const ownSession = await orchestrator.createSession(ownUser);

      const otherUser = await orchestrator.createUser({
        username: "victimuser",
      });
      await orchestrator.activateUser(otherUser);

      const response = await fetch(
        `${webserver.origin}/api/v1/users/${otherUser.username}`,
        {
          method: "DELETE",
          headers: { Cookie: `session_id=${ownSession.token}` },
        },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para excluir outro usuário.",
        action:
          "Verifique se você possui a feature necessária para excluir outro usuário.",
        status_code: 403,
      });

      const stillExists = await user.findOneByUsername(otherUser.username);
      expect(stillExists.id).toBe(otherUser.id);
    });

    test("Returns 404 when target user does not exist", async () => {
      const ownUser = await orchestrator.createUser({
        username: "deletenonexistent",
      });
      await orchestrator.activateUser(ownUser);
      const ownSession = await orchestrator.createSession(ownUser);

      const response = await fetch(
        `${webserver.origin}/api/v1/users/ghostuser`,
        {
          method: "DELETE",
          headers: { Cookie: `session_id=${ownSession.token}` },
        },
      );

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

  describe("Admin user (delete:user:others)", () => {
    test("Can delete another user", async () => {
      const adminUser = await orchestrator.createUser({
        username: "adminuser",
      });
      await orchestrator.activateUser(adminUser);
      await orchestrator.addFeaturesToUser(adminUser, ["delete:user:others"]);
      const adminSession = await orchestrator.createSession(adminUser);

      const victim = await orchestrator.createUser({
        username: "victimoftheadmin",
      });
      await orchestrator.activateUser(victim);

      const response = await fetch(
        `${webserver.origin}/api/v1/users/${victim.username}`,
        {
          method: "DELETE",
          headers: { Cookie: `session_id=${adminSession.token}` },
        },
      );

      expect(response.status).toBe(204);

      await expect(user.findOneByUsername(victim.username)).rejects.toThrow(
        "O username informado não foi encontrado no sistema.",
      );

      const adminStillExists = await user.findOneByUsername(adminUser.username);
      expect(adminStillExists.id).toBe(adminUser.id);
    });
  });
});
