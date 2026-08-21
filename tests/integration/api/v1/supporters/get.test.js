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
    test("Listing every supporter, opted in or not", async () => {
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

      const response = await fetch(`${webserver.origin}/api/v1/supporters`);

      expect(response.status).toBe(200);
      expect(response.headers.get("Cache-Control")).toBe(
        "public, max-age=300, s-maxage=300",
      );

      const responseBody = await response.json();

      // Todo apoiador aparece: não existe mais escolha de não aparecer. Quem
      // não tem a feature continua de fora.
      expect(responseBody).toEqual({
        supporters: [
          {
            username: "apoiadorPrivado",
          },
          {
            username: "apoiadorPublico",
          },
        ],
      });
    });

    test("Revoking the feature removes the supporter from the list", async () => {
      const revokedSupporter = await orchestrator.createUser({
        username: "apoiadorRevogado",
      });
      await orchestrator.addFeaturesToUser(revokedSupporter, ["apoiador"]);
      await supporter.revoke(revokedSupporter.id);

      const response = await fetch(`${webserver.origin}/api/v1/supporters`);

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      const usernames = responseBody.supporters.map((row) => row.username);

      expect(usernames).not.toContain("apoiadorRevogado");
    });
  });
});
