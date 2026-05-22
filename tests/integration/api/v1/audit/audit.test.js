import orchestrator from "tests/orchestrator.js";
import database from "infra/database.js";
import user from "models/user.js";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

async function findAuditLogs(action) {
  const result = await database.query({
    text: `SELECT * FROM audit_logs WHERE action = $1 ORDER BY created_at DESC`,
    values: [action],
  });
  return result.rows;
}

describe("Audit log", () => {
  test("Successful signup records user.created", async () => {
    const response = await fetch(`${webserver.origin}/api/v1/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "auditsignup",
        email: "auditsignup@judhagsan.com",
        password: "senha12345",
        privacy_accepted: true,
      }),
    });
    expect(response.status).toBe(201);

    const createdUser = await user.findOneByUsername("auditsignup");
    const logs = await findAuditLogs("user.created");
    const matching = logs.find((l) => l.target_user_id === createdUser.id);

    expect(matching).toBeDefined();
    expect(matching.actor_user_id).toBe(createdUser.id);
  });

  test("Successful login records session.created", async () => {
    const targetUser = await orchestrator.createUser({
      username: "auditlogin",
      email: "auditlogin@judhagsan.com",
      password: "senha12345",
    });
    await orchestrator.activateUser(targetUser);

    const response = await fetch(`${webserver.origin}/api/v1/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "auditlogin@judhagsan.com",
        password: "senha12345",
      }),
    });
    expect(response.status).toBe(201);

    const logs = await findAuditLogs("session.created");
    const matching = logs.find((l) => l.actor_user_id === targetUser.id);

    expect(matching).toBeDefined();
  });

  test("Failed login records session.failed without revealing user", async () => {
    const response = await fetch(`${webserver.origin}/api/v1/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "naoexiste@judhagsan.com",
        password: "errado",
      }),
    });
    expect(response.status).toBe(401);

    const logs = await findAuditLogs("session.failed");
    expect(logs.length).toBeGreaterThanOrEqual(1);
    // session.failed não tem actor (login não autenticado)
    expect(logs[0].actor_user_id).toBeNull();
  });

  test("Self-delete records user.deleted", async () => {
    const targetUser = await orchestrator.createUser({
      username: "auditdelete",
    });
    await orchestrator.activateUser(targetUser);
    const sessionObject = await orchestrator.createSession(targetUser);

    const response = await fetch(
      `${webserver.origin}/api/v1/users/${targetUser.username}`,
      {
        method: "DELETE",
        headers: { Cookie: `session_id=${sessionObject.token}` },
      },
    );
    expect(response.status).toBe(204);

    const logs = await findAuditLogs("user.deleted");
    const matching = logs.find((l) => l.target_user_id === targetUser.id);
    expect(matching).toBeDefined();
    expect(matching.actor_user_id).toBe(targetUser.id);
  });

  test("Data export records user.exported", async () => {
    const targetUser = await orchestrator.createUser({
      username: "auditexport",
    });
    await orchestrator.activateUser(targetUser);
    const sessionObject = await orchestrator.createSession(targetUser);

    const response = await fetch(`${webserver.origin}/api/v1/user/export`, {
      headers: { Cookie: `session_id=${sessionObject.token}` },
    });
    expect(response.status).toBe(200);

    const logs = await findAuditLogs("user.exported");
    const matching = logs.find((l) => l.actor_user_id === targetUser.id);
    expect(matching).toBeDefined();
  });
});
