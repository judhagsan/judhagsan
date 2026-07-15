import orchestrator from "tests/orchestrator.js";
import supporter from "models/supporter.js";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/supporters", () => {
  describe("Anonymous user", () => {
    test("Retrieving only opted-in supporters", async () => {
      await orchestrator.createUser({
        username: "naoApoiador",
      });

      const privateSupporter = await orchestrator.createUser({
        username: "apoiadorPrivado",
      });
      await orchestrator.addFeaturesToUser(privateSupporter, ["apoiador"]);

      const publicSupporter = await orchestrator.createUser({
        username: "apoiadorPublico",
      });
      await orchestrator.addFeaturesToUser(publicSupporter, ["apoiador"]);
      await supporter.setWallOptIn(publicSupporter.id, true);

      const response = await fetch(`${webserver.origin}/api/v1/supporters`);

      expect(response.status).toBe(200);
      expect(response.headers.get("Cache-Control")).toBe(
        "public, max-age=300, s-maxage=300",
      );

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        supporters: [
          {
            username: "apoiadorPublico",
          },
        ],
      });
    });

    test("Opting out removes the supporter from the list", async () => {
      const optOutSupporter = await orchestrator.createUser({
        username: "apoiadorArrependido",
      });
      await orchestrator.addFeaturesToUser(optOutSupporter, ["apoiador"]);
      await supporter.setWallOptIn(optOutSupporter.id, true);
      await supporter.setWallOptIn(optOutSupporter.id, false);

      const response = await fetch(`${webserver.origin}/api/v1/supporters`);

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      const usernames = responseBody.supporters.map((row) => row.username);

      expect(usernames).not.toContain("apoiadorArrependido");
    });

    test("Revoking the feature removes the supporter from the list", async () => {
      const revokedSupporter = await orchestrator.createUser({
        username: "apoiadorRevogado",
      });
      await orchestrator.addFeaturesToUser(revokedSupporter, ["apoiador"]);
      await supporter.setWallOptIn(revokedSupporter.id, true);
      await supporter.revoke(revokedSupporter.id);

      const response = await fetch(`${webserver.origin}/api/v1/supporters`);

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      const usernames = responseBody.supporters.map((row) => row.username);

      expect(usernames).not.toContain("apoiadorRevogado");
    });
  });
});
