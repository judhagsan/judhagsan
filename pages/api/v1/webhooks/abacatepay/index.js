import abacatepay from "models/abacatepay.js";
import contribution from "models/contribution.js";

// Webhook do AbacatePay: precisa do corpo bruto para validar a assinatura
// HMAC, então o body parser do Next é desligado.
export const config = {
  api: {
    bodyParser: false,
  },
};

async function readRawBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response
      .status(405)
      .json({ name: "MethodNotAllowedError", status_code: 405 });
  }

  const expectedSecret = process.env.ABACATEPAY_WEBHOOK_SECRET;
  if (!expectedSecret) {
    return response.status(500).json({
      name: "InternalServerError",
      message: "ABACATEPAY_WEBHOOK_SECRET não configurado.",
      status_code: 500,
    });
  }

  // Camada 1: segredo na query (?webhookSecret=...), que só o AbacatePay e nós
  // conhecemos.
  if (request.query.webhookSecret !== expectedSecret) {
    return response.status(401).json({
      name: "UnauthorizedError",
      message: "Credencial inválida.",
      status_code: 401,
    });
  }

  const rawBody = await readRawBody(request);

  // Camada 2: assinatura HMAC no header, quando presente.
  const signature = request.headers["x-webhook-signature"];
  if (signature && !abacatepay.verifySignature(rawBody, signature)) {
    return response.status(401).json({
      name: "UnauthorizedError",
      message: "Assinatura inválida.",
      status_code: 401,
    });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return response.status(400).json({
      name: "ValidationError",
      message: "Payload inválido.",
      status_code: 400,
    });
  }

  try {
    const result = await contribution.handleWebhookEvent(event);
    return response.status(200).json({ ok: true, ...result });
  } catch (error) {
    // Log sanitizado; devolve 500 para o AbacatePay reentregar depois.
    console.error("[abacatepay webhook]", {
      event: event?.event,
      id: event?.id,
      error: error?.message,
    });
    return response.status(500).json({ ok: false });
  }
}
