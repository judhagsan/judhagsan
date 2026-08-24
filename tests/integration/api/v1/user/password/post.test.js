import orchestrator from "tests/orchestrator.js";
import user from "models/user.js";
import password from "models/password.js";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

async function createLoggedUser(userObject) {
  const createdUser = await orchestrator.createUser({
    password: "senhaAtual123",
    ...userObject,
  });
  const activatedUser = await orchestrator.activateUser(createdUser);
  const sessionObject = await orchestrator.createSession(activatedUser);

  return { createdUser, sessionObject };
}

function changePassword({ sessionToken, body }) {
  return fetch(`${webserver.origin}/api/v1/user/password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(sessionToken ? { Cookie: `session_id=${sessionToken}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/v1/user/password", () => {
  describe("Anonymous user", () => {
    test("Without session", async () => {
      const response = await changePassword({
        body: {
          current_password: "senhaAtual123",
          new_password: "senhaNova123",
        },
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar esta ação.",
        action: 'Verifique se o seu usuário possui a feature "update:user"',
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test("With correct `current_password`", async () => {
      const { createdUser, sessionObject } = await createLoggedUser();

      const response = await changePassword({
        sessionToken: sessionObject.token,
        body: {
          current_password: "senhaAtual123",
          new_password: "senhaNova123",
        },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: createdUser.id,
        username: createdUser.username,
        updated_at: responseBody.updated_at,
      });
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      const userInDatabase = await user.findOneById(createdUser.id);

      expect(
        await password.compare("senhaNova123", userInDatabase.password),
      ).toBe(true);
      expect(
        await password.compare("senhaAtual123", userInDatabase.password),
      ).toBe(false);
    });

    test("Keeps the current session alive and expires the others", async () => {
      const { createdUser, sessionObject } = await createLoggedUser();
      const otherSession = await orchestrator.createSession(createdUser);

      const response = await changePassword({
        sessionToken: sessionObject.token,
        body: {
          current_password: "senhaAtual123",
          new_password: "senhaNova123",
        },
      });

      expect(response.status).toBe(200);

      const currentSessionResponse = await fetch(
        `${webserver.origin}/api/v1/user`,
        { headers: { Cookie: `session_id=${sessionObject.token}` } },
      );
      expect(currentSessionResponse.status).toBe(200);

      const otherSessionResponse = await fetch(
        `${webserver.origin}/api/v1/user`,
        { headers: { Cookie: `session_id=${otherSession.token}` } },
      );
      expect(otherSessionResponse.status).toBe(401);
    });

    test("Sends a notice email to the user", async () => {
      const { sessionObject } = await createLoggedUser({
        username: "PasswordChangeNotice",
        email: "password.change@judhagsan.com",
      });

      await orchestrator.deleteAllEmails();

      const response = await changePassword({
        sessionToken: sessionObject.token,
        body: {
          current_password: "senhaAtual123",
          new_password: "senhaNova123",
        },
      });

      expect(response.status).toBe(200);

      const lastEmail = await orchestrator.getLastEmail();

      expect(lastEmail.sender).toBe("<contato@judhagsan.com>");
      expect(lastEmail.recipients[0]).toBe("<password.change@judhagsan.com>");
      expect(lastEmail.subject).toBe("Sua senha em Judhagsan foi alterada");
      expect(lastEmail.text).toContain("PasswordChangeNotice");
      expect(lastEmail.text).toContain(`${webserver.origin}/contato`);
    });

    test("Does not send an email when the change fails", async () => {
      const { sessionObject } = await createLoggedUser();

      await orchestrator.deleteAllEmails();

      const response = await changePassword({
        sessionToken: sessionObject.token,
        body: {
          current_password: "senhaErrada123",
          new_password: "senhaNova123",
        },
      });

      expect(response.status).toBe(400);
      expect(await orchestrator.getLastEmail()).toBeNull();
    });

    test("With wrong `current_password`", async () => {
      const { createdUser, sessionObject } = await createLoggedUser();

      const response = await changePassword({
        sessionToken: sessionObject.token,
        body: {
          current_password: "senhaErrada123",
          new_password: "senhaNova123",
        },
      });

      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "A senha atual não confere.",
        action: "Verifique a senha atual e tente novamente.",
        status_code: 400,
      });

      // A senha continua a mesma e a sessão não é derrubada: errar a senha
      // atual não pode deslogar quem está tentando trocá-la.
      const userInDatabase = await user.findOneById(createdUser.id);
      expect(
        await password.compare("senhaAtual123", userInDatabase.password),
      ).toBe(true);

      const stillLoggedResponse = await fetch(
        `${webserver.origin}/api/v1/user`,
        { headers: { Cookie: `session_id=${sessionObject.token}` } },
      );
      expect(stillLoggedResponse.status).toBe(200);
    });

    test("Without `current_password`", async () => {
      const { sessionObject } = await createLoggedUser();

      const response = await changePassword({
        sessionToken: sessionObject.token,
        body: { new_password: "senhaNova123" },
      });

      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "É necessário informar a senha atual.",
        action: "Preencha o campo de senha atual e tente novamente.",
        status_code: 400,
      });
    });

    test("With `new_password` equal to the current one", async () => {
      const { sessionObject } = await createLoggedUser();

      const response = await changePassword({
        sessionToken: sessionObject.token,
        body: {
          current_password: "senhaAtual123",
          new_password: "senhaAtual123",
        },
      });

      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "A nova senha deve ser diferente da senha atual.",
        action: "Escolha uma senha que você ainda não usa nesta conta.",
        status_code: 400,
      });
    });

    test("With `new_password` shorter than 8 characters", async () => {
      const { createdUser, sessionObject } = await createLoggedUser();

      const response = await changePassword({
        sessionToken: sessionObject.token,
        body: {
          current_password: "senhaAtual123",
          new_password: "curta",
        },
      });

      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "A senha deve ter no mínimo 8 caracteres.",
        action: "Escolha uma senha com pelo menos 8 caracteres.",
        status_code: 400,
      });

      const userInDatabase = await user.findOneById(createdUser.id);
      expect(
        await password.compare("senhaAtual123", userInDatabase.password),
      ).toBe(true);
    });
  });
});
