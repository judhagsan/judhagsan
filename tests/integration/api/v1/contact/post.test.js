import orchestrator from "tests/orchestrator.js";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("POST /api/v1/contact", () => {
  beforeEach(async () => {
    await orchestrator.deleteAllEmails();
  });

  describe("Anonymous user", () => {
    test("With valid fields", async () => {
      const response = await fetch(`${webserver.origin}/api/v1/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Judhá",
          email: "judha@exemplo.com",
          message: "Esta é uma mensagem de teste para o Mailcatcher.",
        }),
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody.message).toBe("Mensagem enviada com sucesso!");

      // Verify the email in Mailcatcher
      const lastEmail = await orchestrator.getLastEmail();
      expect(lastEmail).not.toBeNull();
      expect(lastEmail.sender).toBe("<contato@judhagsan.com>");
      expect(lastEmail.recipients[0]).toBe("<contato@judhagsan.com>");
      expect(lastEmail.subject).toBe("Novo contato de Judhá");
      expect(lastEmail.text).toContain("Nome: Judhá");
      expect(lastEmail.text).toContain("Email: judha@exemplo.com");
      expect(lastEmail.text).toContain(
        "Esta é uma mensagem de teste para o Mailcatcher.",
      );
    });

    test("With missing name", async () => {
      const response = await fetch(`${webserver.origin}/api/v1/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "judha@exemplo.com",
          message: "Esta é uma mensagem de teste.",
        }),
      });

      expect(response.status).toBe(400);

      const responseBody = await response.json();
      expect(responseBody.name).toBe("ValidationError");
      expect(responseBody.message).toBe("O nome é obrigatório.");
      expect(responseBody.action).toBe("Preencha o campo nome.");

      const lastEmail = await orchestrator.getLastEmail();
      expect(lastEmail).toBeNull();
    });

    test("With missing email", async () => {
      const response = await fetch(`${webserver.origin}/api/v1/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Judhá",
          message: "Esta é uma mensagem de teste.",
        }),
      });

      expect(response.status).toBe(400);

      const responseBody = await response.json();
      expect(responseBody.name).toBe("ValidationError");
      expect(responseBody.message).toBe("O email é obrigatório.");
      expect(responseBody.action).toBe(
        "Preencha o campo email com um email válido.",
      );

      const lastEmail = await orchestrator.getLastEmail();
      expect(lastEmail).toBeNull();
    });

    test("With invalid email format", async () => {
      const response = await fetch(`${webserver.origin}/api/v1/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Judhá",
          email: "invalid-email",
          message: "Esta é uma mensagem de teste.",
        }),
      });

      expect(response.status).toBe(400);

      const responseBody = await response.json();
      expect(responseBody.name).toBe("ValidationError");
      expect(responseBody.message).toBe("O formato do email é inválido.");
      expect(responseBody.action).toBe("Insira um email válido.");

      const lastEmail = await orchestrator.getLastEmail();
      expect(lastEmail).toBeNull();
    });

    test("With missing message", async () => {
      const response = await fetch(`${webserver.origin}/api/v1/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Judhá",
          email: "judha@exemplo.com",
        }),
      });

      expect(response.status).toBe(400);

      const responseBody = await response.json();
      expect(responseBody.name).toBe("ValidationError");
      expect(responseBody.message).toBe("A mensagem é obrigatória.");
      expect(responseBody.action).toBe("Preencha o campo de mensagem.");

      const lastEmail = await orchestrator.getLastEmail();
      expect(lastEmail).toBeNull();
    });
  });
});
