import orchestrator from "tests/orchestrator.js";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/user/supporter", () => {
  describe("Anonymous user", () => {
    test("Retrieving the endpoint", async () => {
      const response = await fetch(
        `${webserver.origin}/api/v1/user/supporter`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wall_opt_in: true }),
        },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar esta ação.",
        action: 'Verifique se o seu usuário possui a feature "apoiador"',
        status_code: 403,
      });
    });
  });

  describe("Default user (não apoiador)", () => {
    test("Trying to opt in without the feature", async () => {
      const createdUser = await orchestrator.createUser({
        username: "usuarioComum",
      });
      await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(createdUser);

      const response = await fetch(
        `${webserver.origin}/api/v1/user/supporter`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({ wall_opt_in: true }),
        },
      );

      expect(response.status).toBe(403);
    });
  });

  describe("Supporter user", () => {
    test("Opting in and out of the supporters wall", async () => {
      const createdUser = await orchestrator.createUser({
        username: "apoiadorMural",
      });
      await orchestrator.activateUser(createdUser);
      await orchestrator.addFeaturesToUser(createdUser, ["apoiador"]);
      const sessionObject = await orchestrator.createSession(createdUser);

      const optInResponse = await fetch(
        `${webserver.origin}/api/v1/user/supporter`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({ wall_opt_in: true }),
        },
      );

      expect(optInResponse.status).toBe(200);

      const optInBody = await optInResponse.json();

      expect(optInBody.id).toBe(createdUser.id);
      expect(optInBody.username).toBe("apoiadorMural");
      expect(optInBody.supporter_wall_opt_in).toBe(true);
      expect(optInBody.discord_connected).toBe(false);
      expect(optInBody.features).toContain("apoiador");
      expect(optInBody).not.toHaveProperty("password");
      expect(optInBody).not.toHaveProperty("discord_user_id");

      const optOutResponse = await fetch(
        `${webserver.origin}/api/v1/user/supporter`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({ wall_opt_in: false }),
        },
      );

      expect(optOutResponse.status).toBe(200);

      const optOutBody = await optOutResponse.json();
      expect(optOutBody.supporter_wall_opt_in).toBe(false);
    });

    test("With invalid `wall_opt_in` value", async () => {
      const createdUser = await orchestrator.createUser({
        username: "apoiadorInvalido",
      });
      await orchestrator.activateUser(createdUser);
      await orchestrator.addFeaturesToUser(createdUser, ["apoiador"]);
      const sessionObject = await orchestrator.createSession(createdUser);

      const response = await fetch(
        `${webserver.origin}/api/v1/user/supporter`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({ wall_opt_in: "yes" }),
        },
      );

      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "É necessário informar `wall_opt_in` como booleano.",
        action: "Envie `wall_opt_in` com o valor true ou false.",
        status_code: 400,
      });
    });
  });
});
