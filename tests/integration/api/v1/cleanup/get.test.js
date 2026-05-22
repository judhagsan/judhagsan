import orchestrator from "tests/orchestrator.js";
import database from "infra/database.js";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/cleanup", () => {
  test("Without authorization header returns 401", async () => {
    const response = await fetch(`${webserver.origin}/api/v1/cleanup`);
    expect(response.status).toBe(401);
  });

  test("With invalid secret returns 401", async () => {
    const response = await fetch(`${webserver.origin}/api/v1/cleanup`, {
      headers: { Authorization: "Bearer wrong-secret" },
    });
    expect(response.status).toBe(401);
  });

  test("With valid secret deletes expired records", async () => {
    // Seed: usuário + sessão expirada + token de ativação expirado + rate limit antigo
    const userObject = await orchestrator.createUser({
      username: "cleanuptest",
    });
    await orchestrator.activateUser(userObject);

    await database.query({
      text: `
        INSERT INTO sessions (token, user_id, expires_at)
        VALUES ($1, $2, NOW() - INTERVAL '1 hour')
      ;`,
      values: ["expired-session-token-1234", userObject.id],
    });

    await database.query({
      text: `
        INSERT INTO user_activation_tokens (user_id, expires_at)
        VALUES ($1, NOW() - INTERVAL '1 hour')
      ;`,
      values: [userObject.id],
    });

    await database.query({
      text: `
        INSERT INTO rate_limits (identifier, count, window_started_at)
        VALUES ('test:old-ip', 10, NOW() - INTERVAL '2 days')
      ;`,
    });

    // Seed: sessão válida (não deve ser apagada)
    const validSession = await orchestrator.createSession(userObject);

    const response = await fetch(`${webserver.origin}/api/v1/cleanup`, {
      headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
    });

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.sessions_deleted).toBeGreaterThanOrEqual(1);
    expect(body.activation_tokens_deleted).toBeGreaterThanOrEqual(1);
    expect(body.rate_limits_deleted).toBeGreaterThanOrEqual(1);

    // Sessão válida permanece
    const remaining = await database.query({
      text: `SELECT id FROM sessions WHERE token = $1`,
      values: [validSession.token],
    });
    expect(remaining.rowCount).toBe(1);

    // Sessão expirada foi apagada
    const expiredCheck = await database.query({
      text: `SELECT id FROM sessions WHERE token = $1`,
      values: ["expired-session-token-1234"],
    });
    expect(expiredCheck.rowCount).toBe(0);
  });
});
