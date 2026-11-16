import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import email from "infra/email.js";
import { ValidationError } from "infra/errors.js";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .post(
    controller.rateLimit({
      key: "contact",
      limit: 10,
      windowMs: 60 * 60 * 1000, // 10 contacts per hour
    }),
    postHandler,
  )
  .handler(controller.errorHandlers);

async function postHandler(request, response) {
  const { name, email: senderEmail, message } = request.body || {};

  if (typeof name !== "string" || !name.trim()) {
    throw new ValidationError({
      message: "O nome é obrigatório.",
      action: "Preencha o campo nome.",
    });
  }

  if (typeof senderEmail !== "string" || !senderEmail.trim()) {
    throw new ValidationError({
      message: "O email é obrigatório.",
      action: "Preencha o campo email com um email válido.",
    });
  }

  const normalizedName = name.replace(/[\r\n]+/g, " ").trim();
  const normalizedEmail = senderEmail.replace(/[\r\n]+/g, "").trim();

  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    throw new ValidationError({
      message: "O formato do email é inválido.",
      action: "Insira um email válido.",
    });
  }

  if (typeof message !== "string" || !message.trim()) {
    throw new ValidationError({
      message: "A mensagem é obrigatória.",
      action: "Preencha o campo de mensagem.",
    });
  }

  // Send the contact email
  await email.send({
    from: "Formulário de Contato <contato@judhagsan.com>",
    to: "contato@judhagsan.com",
    replyTo: `${normalizedName} <${normalizedEmail}>`,
    subject: `Novo contato de ${normalizedName}`,
    text: `Nome: ${normalizedName}
Email: ${normalizedEmail}

Mensagem:
${message}
`,
  });

  return response.status(200).json({
    message: "Mensagem enviada com sucesso!",
  });
}
