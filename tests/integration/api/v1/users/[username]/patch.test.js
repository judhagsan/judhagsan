import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";
import user from "models/user.js";
import password from "models/password.js";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With unique `username`", async () => {
      const createdUser = await orchestrator.createUser();

      const response = await fetch(
        `${webserver.origin}/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "uniqueUser2",
          }),
        },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        action: 'Verifique se o seu usuário possui a feature "update:user"',
        message: "Você não possui permissão para executar esta ação.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test("With nonexistent `username`", async () => {
      const createdUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const response = await fetch(
        `${webserver.origin}/api/v1/users/UsuarioInexistente`,
        {
          method: "PATCH",
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      );

      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "O username informado não foi encontrado no sistema.",
        action: "Verifique se o username está digitado corretamente.",
        status_code: 404,
      });
    });

    test("With duplicated `username`", async () => {
      await orchestrator.createUser({
        username: "user1",
      });

      const createdUser2 = await orchestrator.createUser({
        username: "user2",
      });

      const activatedUser2 = await orchestrator.activateUser(createdUser2);
      const sessionObject2 = await orchestrator.createSession(activatedUser2);

      const response = await fetch(`${webserver.origin}/api/v1/users/user2`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject2.token}`,
        },
        body: JSON.stringify({
          username: "user1",
        }),
      });

      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "O username informado já está sendo utilizado.",
        action: "Utilize outro username para realizar esta operação.",
        status_code: 400,
      });
    });

    test("With `userB` targeting `userA`", async () => {
      await orchestrator.createUser({
        username: "userA",
      });

      const createdUserB = await orchestrator.createUser({
        username: "userB",
      });

      const activatedUserB = await orchestrator.activateUser(createdUserB);
      const sessionObject2 = await orchestrator.createSession(activatedUserB);

      const response = await fetch(`${webserver.origin}/api/v1/users/userA`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject2.token}`,
        },
        body: JSON.stringify({
          username: "userC",
        }),
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        action:
          "Verifique se você possui a feature necessária para atualizar outro usuário.",
        message: "Você não possui permissão para atualizar outro usuário.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });

    test("With duplicated `email`", async () => {
      await orchestrator.createUser({
        email: "email1@judhagsan.com",
      });

      const createdUser2 = await orchestrator.createUser({
        email: "email2@judhagsan.com",
      });

      const activatedUser2 = await orchestrator.activateUser(createdUser2);
      const sessionObject2 = await orchestrator.createSession(activatedUser2);

      const response = await fetch(
        `${webserver.origin}/api/v1/users/${createdUser2.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject2.token}`,
          },
          body: JSON.stringify({
            email: "email1@judhagsan.com",
          }),
        },
      );

      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "O email informado já está sendo utilizado.",
        action: "Utilize outro email para realizar esta operação.",
        status_code: 400,
      });
    });

    test("With unique `username`", async () => {
      const createdUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const response = await fetch(
        `${webserver.origin}/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            username: "uniqueUser2",
          }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "uniqueUser2",
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });

    test("With unique `email`", async () => {
      const createdUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const response = await fetch(
        `${webserver.origin}/api/v1/users/${createdUser.username}`,

        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            email: "uniqueEmail2@judhagsan.com",
          }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: createdUser.username,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);

      const userInDatabase = await user.findOneByUsername(createdUser.username);
      expect(userInDatabase.email).toBe("uniqueEmail2@judhagsan.com");
    });

    test("With `password`", async () => {
      const createdUser = await orchestrator.createUser({
        password: "newPassword1",
      });
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const response = await fetch(
        `${webserver.origin}/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            password: "newPassword2",
          }),
        },
      );

      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "A senha não pode ser alterada por este endpoint.",
        action: "Utilize o endpoint de alteração de senha.",
        status_code: 400,
      });

      // A senha só muda por POST /api/v1/user/password, que exige a senha
      // atual. Aceitá-la aqui deixava uma sessão roubada trocar a senha.
      const userInDatabase = await user.findOneByUsername(createdUser.username);

      expect(
        await password.compare("newPassword1", userInDatabase.password),
      ).toBe(true);
      expect(
        await password.compare("newPassword2", userInDatabase.password),
      ).toBe(false);
    });

    // `features` nunca chegou ao SQL do UPDATE, então ninguém se promoveu por
    // aqui — mas a resposta era 200, dizendo que um pedido ignorado deu certo.
    test("With `features`", async () => {
      const createdUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const response = await fetch(
        `${webserver.origin}/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            features: ["admin", "update:user:others"],
          }),
        },
      );

      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "Não é possível atualizar: features.",
        action: "Este endpoint atualiza apenas: username, email.",
        status_code: 400,
      });

      const userInDatabase = await user.findOneByUsername(createdUser.username);
      expect(userInDatabase.features).not.toContain("admin");
      expect(userInDatabase.features).not.toContain("update:user:others");
    });

    test("With fields the endpoint does not write", async () => {
      const createdUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const response = await fetch(
        `${webserver.origin}/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            id: "00000000-0000-4000-8000-000000000000",
            created_at: "2020-01-01T00:00:00.000Z",
          }),
        },
      );

      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "Não é possível atualizar: id, created_at.",
        action: "Este endpoint atualiza apenas: username, email.",
        status_code: 400,
      });

      const userInDatabase = await user.findOneByUsername(createdUser.username);
      expect(userInDatabase.id).toBe(createdUser.id);
    });

    // Sem corpo o `request.body` chega `undefined`, e o `in` do model estourava
    // TypeError: 500 numa requisição que é só malformada. Agora termina como o
    // corpo vazio, que sempre respondeu 200.
    test("Without body", async () => {
      const createdUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const response = await fetch(
        `${webserver.origin}/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody.username).toBe(createdUser.username);
    });
  });

  describe("Privileged user", () => {
    test("With `update:user:others` targeting `defaultUser`", async () => {
      const privilegedUser = await orchestrator.createUser();
      const activatedPrivilegedUser =
        await orchestrator.activateUser(privilegedUser);

      await orchestrator.addFeaturesToUser(privilegedUser, [
        "update:user:others",
      ]);

      const privilegedUserSession = await orchestrator.createSession(
        activatedPrivilegedUser,
      );

      const defaultUser = await orchestrator.createUser();

      const response = await fetch(
        `${webserver.origin}/api/v1/users/${defaultUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${privilegedUserSession.token}`,
          },
          body: JSON.stringify({
            username: "AlteradoPorPrivilegiado",
          }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: defaultUser.id,
        username: "AlteradoPorPrivilegiado",
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });
  });
});
