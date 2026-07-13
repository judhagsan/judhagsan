import crypto from "node:crypto";
import { ServiceError } from "infra/errors.js";

const BASE_URL =
  process.env.ABACATEPAY_BASE_URL || "https://api.abacatepay.com/v1";

// Chave pública do AbacatePay usada para o HMAC-SHA256 dos webhooks (a mesma
// para todas as lojas, conforme a doc). A autenticidade real vem do
// `webhookSecret` na query; a assinatura é uma camada extra de integridade.
const WEBHOOK_PUBLIC_KEY =
  "t9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9";

function getApiKey() {
  const apiKey = process.env.ABACATEPAY_API_KEY;
  if (!apiKey) {
    throw new ServiceError({
      message: "O sistema de apoio está indisponível no momento.",
      cause: "Variável de ambiente ABACATEPAY_API_KEY ausente.",
    });
  }
  return apiKey;
}

async function request(path, { method = "GET", body } = {}) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    throw new ServiceError({
      message: "Não foi possível contatar o provedor de pagamento.",
      cause: error,
    });
  }

  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  // A API responde no padrão { data, error }. Erro pode vir com HTTP 200.
  if (!response.ok || payload?.error) {
    throw new ServiceError({
      message: "Falha ao processar o pagamento com o provedor.",
      cause: `AbacatePay ${response.status} em ${path}: ${
        payload?.error || "erro desconhecido"
      }`,
    });
  }

  return payload.data ?? payload;
}

async function createCustomer({ name, email, cellphone, taxId }) {
  return request("/customer/create", {
    method: "POST",
    body: { name, email, cellphone, taxId },
  });
}

async function createPixQrCode({
  amount,
  expiresIn = 3600,
  description,
  customer,
}) {
  return request("/pixQrCode/create", {
    method: "POST",
    body: { amount, expiresIn, description, customer },
  });
}

async function checkPixQrCode(id) {
  return request(`/pixQrCode/check?id=${encodeURIComponent(id)}`, {
    method: "GET",
  });
}

async function createSubscription({
  productId,
  customerId,
  returnUrl,
  completionUrl,
}) {
  return request("/subscriptions/create", {
    method: "POST",
    body: {
      items: [{ id: productId, quantity: 1 }],
      customerId,
      methods: ["CARD"],
      returnUrl,
      completionUrl,
      retryPolicy: { maxRetry: 5, retryEvery: 3 },
    },
  });
}

// HMAC-SHA256 do corpo bruto em base64, comparado em tempo constante.
function verifySignature(rawBody, signatureFromHeader) {
  if (!signatureFromHeader) return false;
  const expected = crypto
    .createHmac("sha256", WEBHOOK_PUBLIC_KEY)
    .update(Buffer.from(rawBody, "utf8"))
    .digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureFromHeader);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const abacatepay = {
  createCustomer,
  createPixQrCode,
  checkPixQrCode,
  createSubscription,
  verifySignature,
};

export default abacatepay;
