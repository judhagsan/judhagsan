import orchestrator from "tests/orchestrator.js";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

async function authenticatedFetch(path, options = {}, sessionToken) {
  return fetch(`${webserver.origin}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Cookie: `session_id=${sessionToken}`,
    },
  });
}

describe("POST /api/v1/devices", () => {
  test("Anonymous cannot upsert", async () => {
    const response = await fetch(`${webserver.origin}/api/v1/devices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        os: "macOS 14.6",
        cpu: "Apple M2",
        gpu: "Apple M2 GPU",
        ram_bytes: 16000000000,
        pindorama_version: "0.0.5",
      }),
    });
    expect(response.status).toBe(403);
  });

  test("Authenticated upsert creates row and dedupes on re-upsert", async () => {
    const userObj = await orchestrator.createUser({ username: "deviceowner" });
    await orchestrator.activateUser(userObj);
    const session = await orchestrator.createSession(userObj);

    const payload = {
      os: "macOS 14.6",
      cpu: "Apple M2 Pro",
      gpu: "Apple M2 Pro GPU",
      ram_bytes: 16000000000,
      pindorama_version: "0.0.5",
    };

    const r1 = await authenticatedFetch(
      "/api/v1/devices",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
      session.token,
    );
    expect(r1.status).toBe(200);
    const device1 = await r1.json();
    expect(device1.os).toBe("macOS 14.6");
    expect(Number(device1.ram_bytes)).toBe(16000000000);
    expect(device1.upload_paused).toBe(false);

    // Second upsert with same fingerprint must dedupe (same id, updated last_seen_at)
    const r2 = await authenticatedFetch(
      "/api/v1/devices",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, pindorama_version: "0.0.6" }),
      },
      session.token,
    );
    expect(r2.status).toBe(200);
    const device2 = await r2.json();
    expect(device2.id).toBe(device1.id);
    expect(device2.pindorama_version).toBe("0.0.6");

    // GET should return one device
    const rList = await authenticatedFetch(
      "/api/v1/devices",
      {},
      session.token,
    );
    expect(rList.status).toBe(200);
    const list = await rList.json();
    expect(list).toHaveLength(1);
  });

  test("Validates required fields", async () => {
    const userObj = await orchestrator.createUser({
      username: "devicemissing",
    });
    await orchestrator.activateUser(userObj);
    const session = await orchestrator.createSession(userObj);

    const response = await authenticatedFetch(
      "/api/v1/devices",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ os: "Linux" }),
      },
      session.token,
    );
    expect(response.status).toBe(400);
  });
});

describe("PATCH /api/v1/devices/[id]", () => {
  test("Owner can pause; paused devices ignore version updates on upsert", async () => {
    const userObj = await orchestrator.createUser({ username: "devicepausa" });
    await orchestrator.activateUser(userObj);
    const session = await orchestrator.createSession(userObj);

    const payload = {
      os: "Linux 6.5",
      cpu: "AMD Ryzen 9",
      gpu: "NVIDIA RTX 4090",
      ram_bytes: 32000000000,
      pindorama_version: "0.0.5",
    };
    const r1 = await authenticatedFetch(
      "/api/v1/devices",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
      session.token,
    );
    const device = await r1.json();

    // Pause
    const rPause = await authenticatedFetch(
      `/api/v1/devices/${device.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ upload_paused: true }),
      },
      session.token,
    );
    expect(rPause.status).toBe(200);
    const pausedDevice = await rPause.json();
    expect(pausedDevice.upload_paused).toBe(true);

    // Upsert with new version while paused — pindorama_version must stay 0.0.5
    const r2 = await authenticatedFetch(
      "/api/v1/devices",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, pindorama_version: "0.0.7" }),
      },
      session.token,
    );
    const stillPaused = await r2.json();
    expect(stillPaused.upload_paused).toBe(true);
    expect(stillPaused.pindorama_version).toBe("0.0.5");
  });

  test("Cannot pause another user's device", async () => {
    const owner = await orchestrator.createUser({ username: "owneraa" });
    await orchestrator.activateUser(owner);
    const ownerSession = await orchestrator.createSession(owner);

    const intruder = await orchestrator.createUser({ username: "intruderaa" });
    await orchestrator.activateUser(intruder);
    const intruderSession = await orchestrator.createSession(intruder);

    const r1 = await authenticatedFetch(
      "/api/v1/devices",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          os: "macOS",
          cpu: "M1",
          gpu: "M1",
          ram_bytes: 8000000000,
          pindorama_version: "0.0.5",
        }),
      },
      ownerSession.token,
    );
    const device = await r1.json();

    const rIntrude = await authenticatedFetch(
      `/api/v1/devices/${device.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ upload_paused: true }),
      },
      intruderSession.token,
    );
    expect(rIntrude.status).toBe(403);
  });
});

describe("DELETE /api/v1/devices/[id]", () => {
  test("Owner can delete; intruder gets 403", async () => {
    const owner = await orchestrator.createUser({ username: "ownerdel" });
    await orchestrator.activateUser(owner);
    const ownerSession = await orchestrator.createSession(owner);

    const intruder = await orchestrator.createUser({ username: "intruderdel" });
    await orchestrator.activateUser(intruder);
    const intruderSession = await orchestrator.createSession(intruder);

    const r1 = await authenticatedFetch(
      "/api/v1/devices",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          os: "Windows 11",
          cpu: "Intel i9",
          gpu: "RTX 3080",
          ram_bytes: 64000000000,
          pindorama_version: "0.0.5",
        }),
      },
      ownerSession.token,
    );
    const device = await r1.json();

    const rIntrude = await authenticatedFetch(
      `/api/v1/devices/${device.id}`,
      { method: "DELETE" },
      intruderSession.token,
    );
    expect(rIntrude.status).toBe(403);

    const rDel = await authenticatedFetch(
      `/api/v1/devices/${device.id}`,
      { method: "DELETE" },
      ownerSession.token,
    );
    expect(rDel.status).toBe(204);

    const rList = await authenticatedFetch(
      "/api/v1/devices",
      {},
      ownerSession.token,
    );
    const list = await rList.json();
    expect(list).toHaveLength(0);
  });
});
