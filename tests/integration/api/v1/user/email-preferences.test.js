import orchestrator from "tests/orchestrator.js";
import user from "models/user.js";
import webserver from "infra/webserver.js";

beforeEach(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("Email preferences & one-click unsubscribe", () => {
  test("authenticated user toggles release_emails_enabled via PATCH /api/v1/user/email-preferences", async () => {
    const anonRes = await fetch(
      `${webserver.origin}/api/v1/user/email-preferences`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ release_emails_enabled: false }),
      },
    );
    expect(anonRes.status).toBe(403);

    const created = await orchestrator.activateUser(
      await orchestrator.createUser({ username: "prefuser" }),
    );
    const session = await orchestrator.createSession(created);

    const invalidRes = await fetch(
      `${webserver.origin}/api/v1/user/email-preferences`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${session.token}`,
        },
        body: JSON.stringify({ release_emails_enabled: "nao" }),
      },
    );
    expect(invalidRes.status).toBe(400);

    const disableRes = await fetch(
      `${webserver.origin}/api/v1/user/email-preferences`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${session.token}`,
        },
        body: JSON.stringify({ release_emails_enabled: false }),
      },
    );
    expect(disableRes.status).toBe(200);
    expect(await disableRes.json()).toEqual({ release_emails_enabled: false });

    const meRes = await fetch(`${webserver.origin}/api/v1/user`, {
      headers: { Cookie: `session_id=${session.token}` },
    });
    const me = await meRes.json();
    expect(me.release_emails_enabled).toBe(false);

    const enableRes = await fetch(
      `${webserver.origin}/api/v1/user/email-preferences`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${session.token}`,
        },
        body: JSON.stringify({ release_emails_enabled: true }),
      },
    );
    expect(enableRes.status).toBe(200);
    expect(await enableRes.json()).toEqual({ release_emails_enabled: true });
  });

  test("public POST /api/v1/email-preferences/unsubscribe/[token] disables notifications without leaking user data", async () => {
    const malformedRes = await fetch(
      `${webserver.origin}/api/v1/email-preferences/unsubscribe/token-invalido`,
      { method: "POST" },
    );
    expect(malformedRes.status).toBe(404);

    const unknownRes = await fetch(
      `${webserver.origin}/api/v1/email-preferences/unsubscribe/11111111-1111-4111-8111-111111111111`,
      { method: "POST" },
    );
    expect(unknownRes.status).toBe(404);

    const created = await orchestrator.activateUser(
      await orchestrator.createUser({
        username: "unsubuser",
        email: "unsubuser@judhagsan.com",
      }),
    );

    const stored = await user.findOneById(created.id);
    expect(stored.release_emails_enabled).toBe(true);
    expect(stored.email_unsubscribe_token).toBeTruthy();

    const response = await fetch(
      `${webserver.origin}/api/v1/email-preferences/unsubscribe/${stored.email_unsubscribe_token}`,
      { method: "POST" },
    );
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toEqual({
      unsubscribed: true,
      release_emails_enabled: false,
    });
    expect(body).not.toHaveProperty("email");
    expect(body).not.toHaveProperty("username");

    const updated = await user.findOneById(created.id);
    expect(updated.release_emails_enabled).toBe(false);
  });
});
