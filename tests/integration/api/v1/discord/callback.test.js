import orchestrator from "tests/orchestrator.js";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/discord/callback", () => {
  describe("Anonymous user", () => {
    test("Retrieving the endpoint", async () => {
      const response = await fetch(
        `${webserver.origin}/api/v1/discord/callback?code=abc&state=def`,
        {
          redirect: "manual",
        },
      );

      expect(response.status).toBe(302);
      expect(response.headers.get("location")).toBe(
        "/sessao?discord=error&reason=forbidden",
      );
    });
  });

  describe("Supporter user", () => {
    test("With mismatched state", async () => {
      const createdUser = await orchestrator.createUser({
        username: "callbackStateErrado",
      });
      await orchestrator.activateUser(createdUser);
      await orchestrator.addFeaturesToUser(createdUser, ["apoiador"]);
      const sessionObject = await orchestrator.createSession(createdUser);

      const response = await fetch(
        `${webserver.origin}/api/v1/discord/callback?code=abc&state=def`,
        {
          redirect: "manual",
          headers: {
            Cookie: `session_id=${sessionObject.token}; discord_oauth_state=outrovalor`,
          },
        },
      );

      expect(response.status).toBe(302);
      expect(response.headers.get("location")).toBe(
        "/sessao?discord=error&reason=invalid_state",
      );
    });

    test("Without code", async () => {
      const createdUser = await orchestrator.createUser({
        username: "callbackSemCode",
      });
      await orchestrator.activateUser(createdUser);
      await orchestrator.addFeaturesToUser(createdUser, ["apoiador"]);
      const sessionObject = await orchestrator.createSession(createdUser);

      const response = await fetch(
        `${webserver.origin}/api/v1/discord/callback?state=def`,
        {
          redirect: "manual",
          headers: {
            Cookie: `session_id=${sessionObject.token}; discord_oauth_state=def`,
          },
        },
      );

      expect(response.status).toBe(302);
      expect(response.headers.get("location")).toBe(
        "/sessao?discord=error&reason=invalid_state",
      );
    });
  });
});
