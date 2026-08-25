import crypto from "node:crypto";
import cleanup from "models/cleanup.js";

/*
 * Comparação em tempo constante, como `mercadopago.validateSignature()` já faz
 * com o HMAC do webhook. `!==` sai no primeiro byte diferente, e o tempo de
 * resposta vira um oráculo que permite descobrir o segredo byte a byte. O
 * risco prático é baixo atrás da rede, mas o padrão certo já existe no
 * projeto — não custa nada usar o mesmo aqui.
 */
function matchesSecret(provided, expected) {
  const providedBuffer = Buffer.from(provided, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");

  // `timingSafeEqual` exige comprimentos iguais. O tamanho do segredo não é o
  // que se protege aqui, então comparar antes é aceitável.
  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}

export default async function handler(request, response) {
  if (request.method !== "GET" && request.method !== "POST") {
    response.setHeader("Allow", "GET, POST");
    return response
      .status(405)
      .json({ name: "MethodNotAllowedError", status_code: 405 });
  }

  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret) {
    return response.status(500).json({
      name: "InternalServerError",
      message: "CRON_SECRET não configurado.",
      status_code: 500,
    });
  }

  // Vercel Cron envia: Authorization: Bearer <CRON_SECRET>
  const header = request.headers["authorization"] || "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!matchesSecret(provided, expectedSecret)) {
    return response.status(401).json({
      name: "UnauthorizedError",
      message: "Credencial inválida.",
      status_code: 401,
    });
  }

  const result = await cleanup.runCleanup();

  response.setHeader("Cache-Control", "no-store");
  return response.status(200).json({
    ok: true,
    ran_at: new Date().toISOString(),
    ...result,
  });
}
