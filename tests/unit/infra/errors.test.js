import { ServiceError } from "infra/errors.js";

describe("ServiceError", () => {
  test("toJSON does not include `context` (no PII leak in HTTP responses)", () => {
    const sensitiveMailOptions = {
      from: "Judhagsan <contato@judhagsan.com>",
      to: "victim@example.com",
      subject: "Reset your password",
      text: "click here: https://...",
    };

    const error = new ServiceError({
      message: "Não foi possível enviar o email.",
      action: "Verifique se o serviço de email está disponível.",
      cause: new Error("SMTP timeout"),
      context: sensitiveMailOptions,
    });

    expect(error.context).toEqual(sensitiveMailOptions);

    const serialized = JSON.parse(JSON.stringify(error));

    expect(serialized).toEqual({
      name: "ServiceError",
      message: "Não foi possível enviar o email.",
      action: "Verifique se o serviço de email está disponível.",
      status_code: 503,
    });

    expect(serialized).not.toHaveProperty("context");
  });

  test("uses default message/action when not provided", () => {
    const error = new ServiceError({});
    const serialized = JSON.parse(JSON.stringify(error));

    expect(serialized.message).toBe("Serviço indisponível no momento.");
    expect(serialized.action).toBe("Verifique se o serviço está disponível.");
    expect(serialized.status_code).toBe(503);
    expect(serialized).not.toHaveProperty("context");
  });
});
