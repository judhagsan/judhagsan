import orchestrator from "tests/orchestrator.js";
import userDevice from "models/userDevice.js";
import webserver from "infra/webserver.js";

const GB = 1024 * 1024 * 1024;

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

// O endpoint agrega a base inteira, então cada teste precisa de um banco só
// seu: um dispositivo deixado para trás mudaria toda contagem.
beforeEach(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

async function createReader() {
  const createdUser = await orchestrator.createUser();
  const activatedUser = await orchestrator.activateUser(createdUser);
  await orchestrator.addFeaturesToUser(activatedUser, ["read:device:all"]);
  const sessionObject = await orchestrator.createSession(activatedUser);

  return { activatedUser, sessionObject };
}

async function addDevice(userId, hardwareUuid, overrides = {}) {
  return await userDevice.upsert({
    userId,
    hardwareUuid,
    os: "Windows 11",
    cpu: "Intel Core i5",
    ramBytes: 16 * GB,
    gpu: "NVIDIA GeForce RTX 3060",
    tablet: "Wacom One",
    monitor: "Dell U2723QE",
    pindoramaVersion: "0.1.0",
    ...overrides,
  });
}

function getStats({ sessionToken, query = "" } = {}) {
  return fetch(`${webserver.origin}/api/v1/devices/stats${query}`, {
    headers: sessionToken ? { Cookie: `session_id=${sessionToken}` } : {},
  });
}

describe("GET /api/v1/devices/stats", () => {
  describe("Anonymous user", () => {
    test("Without session", async () => {
      const response = await getStats();

      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody.action).toContain("read:device:all");
    });
  });

  describe("Default user", () => {
    // Todo usuário ativado tem `manage:device`, que é sobre os próprios
    // aparelhos. Ver o parque inteiro é outro poder.
    test("With `manage:device` but not `read:device:all`", async () => {
      const createdUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser);

      expect(activatedUser.features).toContain("manage:device");

      const response = await getStats({ sessionToken: sessionObject.token });
      expect(response.status).toBe(403);
    });
  });

  describe("User with `read:device:all`", () => {
    test("With an empty base", async () => {
      const { sessionObject } = await createReader();

      const response = await getStats({ sessionToken: sessionObject.token });

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody.total).toBe(0);
      expect(responseBody.dimensions.os).toEqual([]);
      expect(responseBody.dimensions.monitor).toEqual([]);
    });

    test("Counts each value across every user", async () => {
      const { activatedUser, sessionObject } = await createReader();
      const other = await orchestrator.activateUser(
        await orchestrator.createUser(),
      );

      await addDevice(activatedUser.id, "uuid-1", { os: "Windows 11" });
      await addDevice(activatedUser.id, "uuid-2", { os: "Linux" });
      await addDevice(other.id, "uuid-3", { os: "Windows 11" });

      const response = await getStats({ sessionToken: sessionObject.token });
      const responseBody = await response.json();

      expect(responseBody.total).toBe(3);
      expect(responseBody.dimensions.os).toEqual([
        { value: "Windows 11", count: 2 },
        { value: "Linux", count: 1 },
      ]);
    });

    // Bytes brutos espalhariam a moda: 16.0 e 15.9 GB são a mesma
    // configuração para quem lê o card.
    test("Buckets `ram_bytes` into rounded GB", async () => {
      const { activatedUser, sessionObject } = await createReader();

      await addDevice(activatedUser.id, "uuid-1", { ramBytes: 16 * GB });
      await addDevice(activatedUser.id, "uuid-2", {
        ramBytes: Math.round(15.9 * GB),
      });
      await addDevice(activatedUser.id, "uuid-3", { ramBytes: 32 * GB });

      const response = await getStats({ sessionToken: sessionObject.token });
      const responseBody = await response.json();

      expect(responseBody.dimensions.ram).toEqual([
        { value: "16 GB", count: 2 },
        { value: "32 GB", count: 1 },
      ]);
    });

    /*
     * O agregado existe para descrever o parque, não para ligar hardware a
     * pessoa. Se `user_id` ou `hardware_uuid` vazassem aqui, a rota deixaria
     * de ser agregada e viraria uma listagem de quem tem o quê.
     */
    test("Never returns anything that identifies a user or a machine", async () => {
      const { activatedUser, sessionObject } = await createReader();
      await addDevice(activatedUser.id, "uuid-secreto");

      const response = await getStats({ sessionToken: sessionObject.token });
      const raw = JSON.stringify(await response.json());

      expect(raw).not.toContain("uuid-secreto");
      expect(raw).not.toContain(activatedUser.id);
      expect(raw).not.toContain("user_id");
      expect(raw).not.toContain("hardware_uuid");
    });

    test("Ignores null and empty values", async () => {
      const { activatedUser, sessionObject } = await createReader();

      await addDevice(activatedUser.id, "uuid-1", { tablet: null });
      await addDevice(activatedUser.id, "uuid-2", { tablet: "Wacom One" });

      const response = await getStats({ sessionToken: sessionObject.token });
      const responseBody = await response.json();

      expect(responseBody.total).toBe(2);
      expect(responseBody.dimensions.tablet).toEqual([
        { value: "Wacom One", count: 1 },
      ]);
    });

    test("Clamps an out-of-range `limit`", async () => {
      const { sessionObject } = await createReader();

      const tooHigh = await getStats({
        sessionToken: sessionObject.token,
        query: "?limit=9999",
      });
      expect((await tooHigh.json()).limit).toBe(20);

      const notANumber = await getStats({
        sessionToken: sessionObject.token,
        query: "?limit=abc",
      });
      expect((await notANumber.json()).limit).toBe(5);
    });

    test("Honours a valid `limit`", async () => {
      const { activatedUser, sessionObject } = await createReader();

      await addDevice(activatedUser.id, "uuid-1", { gpu: "GPU A" });
      await addDevice(activatedUser.id, "uuid-2", { gpu: "GPU B" });
      await addDevice(activatedUser.id, "uuid-3", { gpu: "GPU C" });

      const response = await getStats({
        sessionToken: sessionObject.token,
        query: "?limit=2",
      });
      const responseBody = await response.json();

      expect(responseBody.dimensions.gpu).toHaveLength(2);
      expect(responseBody.total).toBe(3);
    });
  });
});
