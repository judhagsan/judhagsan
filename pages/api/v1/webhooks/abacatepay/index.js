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

  // Confirma que a requisição chegou (sem logar o segredo em si).
  console.log("[abacatepay webhook] POST recebido", {
    hasSecretQuery: Boolean(request.query.webhookSecret),
    hasSignature: Boolean(request.headers["x-webhook-signature"]),
  });

  const expectedSecret = process.env.ABACATEPAY_WEBHOOK_SECRET;
  if (!expectedSecret) {
    console.error("[abacatepay webhook] ABACATEPAY_WEBHOOK_SECRET não setado");
    return response.status(500).json({
      name: "InternalServerError",
      message: "ABACATEPAY_WEBHOOK_SECRET não configurado.",
      status_code: 500,
    });
  }

  // Camada 1: segredo na query (?webhookSecret=...), que só o AbacatePay e nós
  // conhecemos.
  if (request.query.webhookSecret !== expectedSecret) {
    console.warn("[abacatepay webhook] segredo da query não confere (401)");
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

  // Log de diagnóstico (sem PII: só nomes/ids e a estrutura do payload) para
  // entender o que o AbacatePay envia e por que o benefício foi ou não concedido.
  console.log("[abacatepay webhook] recebido", {
    event: event?.event,
    id: event?.id,
    dataId: event?.data?.id,
    customerId: event?.data?.customer?.id || event?.data?.customerId,
    dataKeys: event?.data ? Object.keys(event.data) : [],
  });

  try {
    const result = await contribution.handleWebhookEvent(event);
    console.log("[abacatepay webhook] resultado", {
      event: event?.event,
      ...result,
    });
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
