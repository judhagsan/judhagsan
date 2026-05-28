import orchestrator from "tests/orchestrator.js";
import user from "models/user.js";
import password from "models/password.js";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/users", () => {
  describe("Anonymous user", () => {
    test("With unique and valid data", async () => {
      const response = await fetch(`${webserver.origin}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "judhagsanuser",
          email: "contato@judhagsan.com",
          password: "senha12345",
          privacy_accepted: true,
        }),
      });

      expect(response.status).toBe(201);

      const responseBody = await response.json();
      expect(responseBody.message).toContain("link de ativação");

      const userInDatabase = await user.findOneByUsername("judhagsanuser");
      expect(userInDatabase.email).toBe("contato@judhagsan.com");
      expect(userInDatabase.features).toEqual(["read:activation_token"]);

      const correctPasswordMatch = await password.compare(
        "senha12345",
        userInDatabase.password,
      );

      const incorrectPasswordMatch = await password.compare(
        "SenhaErrada",
        userInDatabase.password,
      );

      expect(correctPasswordMatch).toBe(true);
      expect(incorrectPasswordMatch).toBe(false);
    });

    test("With duplicated `email` (anti-enumeration)", async () => {
      const response1 = await fetch(`${webserver.origin}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "emailduplicado1",
          email: "duplicado@judhagsan.com",
          password: "senha12345",
          privacy_accepted: true,
        }),
      });

      expect(response1.status).toBe(201);

      const response2 = await fetch(`${webserver.origin}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "emailduplicado2",
          email: "Duplicado@judhagsan.com",
          password: "outrasenha",
          privacy_accepted: true,
        }),
      });

      // Resposta idêntica à de sucesso para não revelar enumeração
      expect(response2.status).toBe(201);
      const response2Body = await response2.json();
      expect(response2Body.message).toContain("link de ativação");

      // Garante que nenhum usuário duplicado foi criado e o original foi preservado
      const userInDatabase = await user.findOneByEmail(
        "duplicado@judhagsan.com",
      );
      expect(userInDatabase.username).toBe("emailduplicado1");
      const originalPasswordIntact = await password.compare(
        "senha12345",
        userInDatabase.password,
      );
      expect(originalPasswordIntact).toBe(true);
    });

    test("With password shorter than 8 characters", async () => {
      const response = await fetch(`${webserver.origin}/api/v1/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "senhacurta",
          email: "senhacurta@judhagsan.com",
          password: "abc123",
          privacy_accepted: true,
        }),
      });

      expect(response.status).toBe(400);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "A senha deve ter no mínimo 8 caracteres.",
        action: "Escolha uma senha com pelo menos 8 caracteres.",
        status_code: 400,
      });
    });

    test("Without privacy acceptance", async () => {
      const response = await fetch(`${webserver.origin}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "semaceite",
          email: "semaceite@judhagsan.com",
          password: "senha12345",
        }),
      });

      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "É necessário aceitar os Termos de Uso para se cadastrar.",
        action: "Marque a opção de aceite e tente novamente.",
        status_code: 400,
      });
    });

    test("With duplicated `username`", async () => {
      const response1 = await fetch(`${webserver.origin}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "usernameduplicado",
          email: "usernameduplicado1@judhagsan.com",
          password: "senha12345",
          privacy_accepted: true,
        }),
      });

      expect(response1.status).toBe(201);

      const response2 = await fetch(`${webserver.origin}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "UsernameDuplicado",
          email: "usernameduplicado2@judhagsan.com",
          password: "senha12345",
          privacy_accepted: true,
        }),
      });

      expect(response2.status).toBe(400);

      const response2Body = await response2.json();

      expect(response2Body).toEqual({
        name: "ValidationError",
        message: "O username informado já está sendo utilizado.",
        action: "Utilize outro username para realizar esta operação.",
        status_code: 400,
      });
    });
  });

  describe("Default user", () => {
    test("With unique and valid data", async () => {
      const user1 = await orchestrator.createUser();
      await orchestrator.activateUser(user1);
      const user1SessionObject = await orchestrator.createSession(user1);

      const user2Response = await fetch(`${webserver.origin}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${user1SessionObject.token}`,
        },
        body: JSON.stringify({
          username: "usuariologado",
          email: "usuariologado@judhagsan.com",
          password: "senha12345",
          privacy_accepted: true,
        }),
      });

      expect(user2Response.status).toBe(403);

      const user2ResponseBody = await user2Response.json();

      expect(user2ResponseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar esta ação.",
        action: 'Verifique se o seu usuário possui a feature "create:user"',
        status_code: 403,
      });
    });
  });
});
