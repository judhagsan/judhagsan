import orchestrator from "tests/orchestrator.js";
import user from "models/user.js";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/user/export", () => {
  describe("Anonymous user", () => {
    test("Cannot export", async () => {
      const response = await fetch(`${webserver.origin}/api/v1/user/export`);
      expect(response.status).toBe(403);
    });
  });

  describe("Authenticated user", () => {
    test("Exports own data with proper headers", async () => {
      const userObject = await orchestrator.createUser({
        username: "exporter",
        email: "exporter@judhagsan.com",
      });
      await orchestrator.activateUser(userObject);
      const sessionObject = await orchestrator.createSession(userObject);

      const response = await fetch(`${webserver.origin}/api/v1/user/export`, {
        headers: { Cookie: `session_id=${sessionObject.token}` },
      });

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain(
        "application/json",
      );
      expect(response.headers.get("content-disposition")).toContain(
        'attachment; filename="judhagsan-export-exporter-',
      );
      expect(response.headers.get("cache-control")).toContain("no-store");

      const body = await response.json();

      expect(body._meta.format_version).toBe("1.0");
      expect(body._meta.description).toContain("dados pessoais");

      expect(body.user.username).toBe("exporter");
      expect(body.user.email).toBe("exporter@judhagsan.com");
      expect(Date.parse(body.user.created_at)).not.toBeNaN();
      expect(body.user).not.toHaveProperty("id");
      expect(body.user).not.toHaveProperty("password");
      expect(body.user).not.toHaveProperty("features");
      expect(body.user).not.toHaveProperty("updated_at");

      expect(body.sessions).toHaveLength(1);
      expect(body.sessions[0]).not.toHaveProperty("id");
      expect(body.sessions[0]).not.toHaveProperty("token");
      expect(body.sessions[0]).not.toHaveProperty("updated_at");
      expect(Date.parse(body.sessions[0].created_at)).not.toBeNaN();
      expect(Date.parse(body.sessions[0].expires_at)).not.toBeNaN();

      expect(Array.isArray(body.activation_tokens)).toBe(true);
    });

    test("Includes activation tokens when user signed up via API", async () => {
      const signupResponse = await fetch(`${webserver.origin}/api/v1/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "apiexporter",
          email: "apiexporter@judhagsan.com",
          password: "senha12345",
          privacy_accepted: true,
        }),
      });
      expect(signupResponse.status).toBe(201);

      const userViaApi = await user.findOneByUsername("apiexporter");
      await orchestrator.activateUser(userViaApi);
      const sessionObject = await orchestrator.createSession(userViaApi);

      const response = await fetch(`${webserver.origin}/api/v1/user/export`, {
        headers: { Cookie: `session_id=${sessionObject.token}` },
      });

      expect(response.status).toBe(200);
      const body = await response.json();

      expect(body.activation_tokens.length).toBeGreaterThanOrEqual(1);
      expect(body.activation_tokens[0]).not.toHaveProperty("id");
      expect(body.activation_tokens[0]).not.toHaveProperty("updated_at");
      expect(body.activation_tokens[0]).not.toHaveProperty("token");
      expect(Date.parse(body.activation_tokens[0].created_at)).not.toBeNaN();
    });
  });
});
