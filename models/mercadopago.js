import crypto from "node:crypto";
import { ServiceError, NotFoundError } from "infra/errors.js";

// Integração com o Mercado Pago (https://www.mercadopago.com.br/developers).
//
// Dois fluxos convivem aqui:
//
// 1. Assinatura mensal no cartão (`preapproval`). O Mercado Pago cobra sozinho
//    a cada ciclo e, quando a cobrança é rejeitada, retenta por até 10 dias.
// 2. Pix avulso, gerado a pedido de quem teve o cartão recusado e quer manter
//    o apoio na mão.
//
// Nos dois, o `external_reference` carrega o id do nosso usuário — é ele que
// permite ao webhook saber de quem é a cobrança sem depender de e-mail.

const API_BASE_URL = "https://api.mercadopago.com";

// Prefixo do `external_reference`, para não confundir com outra integração que
// venha a usar o mesmo campo.
const REFERENCE_PREFIX = "user";

// Para onde o Mercado Pago devolve quem vier de um fluxo com redirect. A
// Vercel expõe o host de cada deploy, então preview e produção acertam
// sozinhos: `VERCEL_BRANCH_URL` é estável por branch (a de deploy muda a cada
// push e deixaria a variável desatualizada). O domínio público é o último
// recurso porque a API recusa qualquer coisa que não seja URL válida — e isso
// inclui localhost, que foi como o primeiro teste quebrou.
function getBackUrl() {
  if (process.env.MERCADOPAGO_BACK_URL) {
    return process.env.MERCADOPAGO_BACK_URL;
  }

  const vercelHost = process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL;

  if (vercelHost) {
    return `https://${vercelHost}/apoiar`;
  }

  return "https://judhagsan.com/apoiar";
}

function getConfiguration() {
  const configuration = {
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
    webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET,
  };

  const missingValues = Object.entries(configuration)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingValues.length > 0) {
    throw new ServiceError({
      message: "A integração com o Mercado Pago não está configurada.",
      cause: `Variáveis de ambiente ausentes: ${missingValues.join(", ")}`,
    });
  }

  return configuration;
}

async function request(path, { method = "GET", body, idempotencyKey } = {}) {
  const { accessToken } = getConfiguration();

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  // Sem isso, um retry de rede pode cobrar duas vezes.
  if (idempotencyKey) {
    headers["X-Idempotency-Key"] = idempotencyKey;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const responseBody = await response.json().catch(() => null);

  // 404 só vira NotFoundError em consulta: aí ele significa mesmo "esse
  // recurso não existe" — notificação de teste, recurso apagado — e o webhook
  // fecha o evento em vez de reentregar para sempre.
  //
  // Em criação, 404 é outra coisa: foi assim que o "Card token service not
  // found" chegou ao browser como 404 da nossa API, parecendo rota inexistente.
  // Falha de serviço tem que se parecer com falha de serviço.
  if (response.status === 404 && method === "GET") {
    throw new NotFoundError({
      message: "Recurso não encontrado no Mercado Pago.",
      cause: `${method} ${path} respondeu 404: ${JSON.stringify(responseBody)}`,
    });
  }

  if (!response.ok) {
    // O controller sanitiza o log e descarta a `cause`, para não vazar dado
    // pessoal de outras integrações. O que se perde aí é justamente o motivo
    // da recusa — então ele sai antes, com o que o Mercado Pago respondeu e
    // nada do que enviamos.
    console.error({
      name: "MercadoPagoError",
      request: `${method} ${path}`,
      status: response.status,
      response: responseBody,
    });

    throw new ServiceError({
      message: "O Mercado Pago recusou a requisição.",
      cause: `${method} ${path} respondeu HTTP ${response.status}: ${JSON.stringify(responseBody)}`,
    });
  }

  return responseBody;
}

// Resultado da validação da public key, guardado em memória. Ela só muda em
// deploy, e ir ao Mercado Pago a cada abertura do card custaria latência à
// toa. O valor da chave entra na comparação para o cache não sobreviver a uma
// troca de credencial no mesmo processo.
let publicKeyValidation = null;

// Devolve a public key só se o Mercado Pago ainda a reconhecer, senão `null`.
//
// Checar presença não basta: regenerar as credenciais no painel **invalida a
// anterior**, e a chave morta continua com o formato certo (`APP_USR-` + UUID).
// Com ela, o SDK no browser leva 404 em `POST /v1/card_tokens` sem dizer o
// motivo — o formulário monta, a pessoa digita o cartão inteiro e só descobre
// no envio que nada funciona. Devolvendo `null` aqui, o card já nasce
// declarando que o apoio está indisponível, e o servidor registra a razão.
async function getValidPublicKey() {
  const publicKey = process.env.MERCADOPAGO_PUBLIC_KEY;

  if (!publicKey) {
    return null;
  }

  if (publicKeyValidation?.publicKey === publicKey) {
    return publicKeyValidation.valid ? publicKey : null;
  }

  let response;

  try {
    response = await fetch(
      `${API_BASE_URL}/v1/payment_methods?public_key=${encodeURIComponent(publicKey)}`,
    );
  } catch (cause) {
    // Rede fora não é chave inválida: não cacheia, para a próxima tentativa
    // poder acertar.
    console.error({
      name: "MercadoPagoError",
      request: "GET /v1/payment_methods",
      response: cause?.message,
    });
    return null;
  }

  const valid = response.ok;

  if (!valid) {
    console.error({
      name: "MercadoPagoError",
      request: "GET /v1/payment_methods",
      status: response.status,
      response: await response.json().catch(() => null),
    });
  }

  publicKeyValidation = { publicKey, valid };

  return valid ? publicKey : null;
}

function buildExternalReference(userId) {
  return `${REFERENCE_PREFIX}:${userId}`;
}

function parseExternalReference(externalReference) {
  if (typeof externalReference !== "string") {
    return null;
  }

  const [prefix, userId] = externalReference.split(":");

  return prefix === REFERENCE_PREFIX && userId ? userId : null;
}

async function createSubscription({
  userId,
  email,
  cardTokenId,
  amount,
  reason,
}) {
  return await request("/preapproval", {
    method: "POST",
    idempotencyKey: `preapproval-${userId}-${Date.now()}`,
    body: {
      reason,
      external_reference: buildExternalReference(userId),
      payer_email: email,
      card_token_id: cardTokenId,
      back_url: getBackUrl(),
      // "authorized" já nasce cobrando: a primeira parcela sai em até uma hora.
      status: "authorized",
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: amount,
        currency_id: "BRL",
      },
    },
  });
}

async function getSubscription(preapprovalId) {
  return await request(`/preapproval/${preapprovalId}`);
}

async function cancelSubscription(preapprovalId) {
  return await request(`/preapproval/${preapprovalId}`, {
    method: "PUT",
    body: { status: "cancelled" },
  });
}

// Pagamento autorizado de uma assinatura: é o que o tópico
// `subscription_authorized_payment` notifica a cada ciclo cobrado.
async function getAuthorizedPayment(authorizedPaymentId) {
  return await request(`/authorized_payments/${authorizedPaymentId}`);
}

// Pix avulso para quem teve o cartão recusado. Vale um ciclo e não renova.
async function createPixOrder({
  userId,
  email,
  amount,
  expiresInMinutes = 30,
}) {
  return await request("/v1/orders", {
    method: "POST",
    idempotencyKey: `pix-${userId}-${Date.now()}`,
    body: {
      type: "online",
      processing_mode: "automatic",
      total_amount: amount.toFixed(2),
      external_reference: buildExternalReference(userId),
      payer: { email },
      transactions: {
        payments: [
          {
            amount: amount.toFixed(2),
            payment_method: {
              id: "pix",
              type: "bank_transfer",
            },
            expiration_time: `PT${expiresInMinutes}M`,
          },
        ],
      },
    },
  });
}

async function getOrder(orderId) {
  return await request(`/v1/orders/${orderId}`);
}

async function getPayment(paymentId) {
  return await request(`/v1/payments/${paymentId}`);
}

// Valida a assinatura do webhook (HMAC-SHA256 sobre um template com o id do
// recurso, o x-request-id e o timestamp). É o que separa uma notificação real
// de um POST forjado por quem descobriu a URL.
function isValidSignature({ signatureHeader, requestId, dataId }) {
  const { webhookSecret } = getConfiguration();

  if (!signatureHeader) {
    return false;
  }

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key?.trim(), value?.trim()];
    }),
  );

  const timestamp = parts.ts;
  const receivedHash = parts.v1;

  if (!timestamp || !receivedHash) {
    return false;
  }

  // O template exige o id em minúsculas quando alfanumérico.
  const manifest = `id:${String(dataId).toLowerCase()};request-id:${requestId};ts:${timestamp};`;

  const expectedHash = crypto
    .createHmac("sha256", webhookSecret)
    .update(manifest)
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedHash, "utf8");
  const receivedBuffer = Buffer.from(receivedHash, "utf8");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

const mercadopago = {
  getBackUrl,
  getValidPublicKey,
  buildExternalReference,
  parseExternalReference,
  createSubscription,
  getSubscription,
  cancelSubscription,
  getAuthorizedPayment,
  createPixOrder,
  getOrder,
  getPayment,
  isValidSignature,
};

export default mercadopago;
