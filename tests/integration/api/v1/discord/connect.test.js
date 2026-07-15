import setCookieParser from "set-cookie-parser";
import orchestrator from "tests/orchestrator.js";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/discord/connect", () => {
  describe("Anonymous user", () => {
    test("Retrieving the endpoint", async () => {
      const response = await fetch(
        `${webserver.origin}/api/v1/discord/connect`,
        {
          redirect: "manual",
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
    test("Trying to connect without the feature", async () => {
      const createdUser = await orchestrator.createUser({
        username: "comumDiscord",
      });
      await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(createdUser);

      const response = await fetch(
        `${webserver.origin}/api/v1/discord/connect`,
        {
          redirect: "manual",
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      );

      expect(response.status).toBe(403);
    });
  });

  describe("Supporter user", () => {
    test("Redirects to Discord authorize URL with state cookie", async () => {
      const createdUser = await orchestrator.createUser({
        username: "apoiadorDiscord",
      });
      await orchestrator.activateUser(createdUser);
      await orchestrator.addFeaturesToUser(createdUser, ["apoiador"]);
      const sessionObject = await orchestrator.createSession(createdUser);

      const response = await fetch(
        `${webserver.origin}/api/v1/discord/connect`,
        {
          redirect: "manual",
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      );

      expect(response.status).toBe(302);

      const location = new URL(response.headers.get("location"));

      expect(location.origin).toBe("https://discord.com");
      expect(location.pathname).toBe("/oauth2/authorize");
      expect(location.searchParams.get("client_id")).toBe(
        process.env.DISCORD_CLIENT_ID,
      );
      expect(location.searchParams.get("redirect_uri")).toBe(
        process.env.DISCORD_REDIRECT_URI,
      );
      expect(location.searchParams.get("response_type")).toBe("code");
      expect(location.searchParams.get("scope")).toBe("identify guilds.join");

      const state = location.searchParams.get("state");
      expect(state).toMatch(/^[0-9a-f]{32}$/);

      const parsedSetCookie = setCookieParser(response, { map: true });

      expect(parsedSetCookie.discord_oauth_state).toEqual({
        name: "discord_oauth_state",
        value: state,
        maxAge: 600,
        path: "/api/v1/discord",
        httpOnly: true,
        sameSite: "Lax",
      });
    });
  });
});
