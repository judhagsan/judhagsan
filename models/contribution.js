import database from "infra/database.js";
import webserver from "infra/webserver.js";
import abacatepay from "models/abacatepay.js";
import supporter from "models/supporter.js";
import discord from "models/discord.js";
import { ValidationError, ServiceError } from "infra/errors.js";

const MONTHLY_PRODUCT_ID = process.env.ABACATEPAY_MONTHLY_PRODUCT_ID;
const PIX_MIN_CENTS = 100; // R$ 1,00 (mínimo do AbacatePay)
const PIX_MAX_CENTS = 500000; // R$ 5.000,00

// Eventos que confirmam pagamento e concedem a feature de apoiador.
const PAID_EVENT = /\.(paid|completed|renewed)$/;

async function ensureCustomer(userObject, { taxId } = {}) {
  if (userObject.abacatepay_customer_id) {
    return userObject.abacatepay_customer_id;
  }

  const customer = await abacatepay.createCustomer({
    name: userObject.username,
    email: userObject.email,
    taxId,
  });

  await database.query({
    text: `
      UPDATE users
      SET abacatepay_customer_id = $2, updated_at = timezone('utc', now())
      WHERE id = $1
    ;`,
    values: [userObject.id, customer.id],
  });

  return customer.id;
}

function normalizeTaxId(taxId) {
  const digits = String(taxId || "").replace(/\D/g, "");
  if (digits.length !== 11) {
    throw new ValidationError({
      message: "CPF inválido.",
      action: "Informe um CPF válido, com 11 dígitos.",
    });
  }
  return digits;
}

async function startPix(userObject, { amountCents, taxId }) {
  if (
    !Number.isInteger(amountCents) ||
    amountCents < PIX_MIN_CENTS ||
    amountCents > PIX_MAX_CENTS
  ) {
    throw new ValidationError({
      message: "Valor de apoio inválido.",
      action: "Escolha um valor entre R$ 1,00 e R$ 5.000,00.",
    });
  }

  const cleanTaxId = normalizeTaxId(taxId);

  const pix = await abacatepay.createPixQrCode({
    amount: amountCents,
    expiresIn: 3600,
    description: `Apoio ao Pindorama — ${userObject.username}`,
    customer: {
      name: userObject.username,
      email: userObject.email,
      taxId: cleanTaxId,
    },
  });

  await recordPayment({
    userId: userObject.id,
    method: "pix",
    kind: "one_time",
    providerId: pix.id,
    amountCents,
    status: pix.status,
  });

  return {
    id: pix.id,
    brCode: pix.brCode,
    brCodeBase64: pix.brCodeBase64,
    amount: pix.amount,
    status: pix.status,
    expiresAt: pix.expiresAt,
  };
}

async function checkPix(userObject, pixId) {
  const payment = await findPaymentByProviderId(pixId);
  if (!payment || payment.user_id !== userObject.id) {
    throw new ValidationError({
      message: "Cobrança não encontrada.",
      action: "Verifique o pagamento e tente novamente.",
    });
  }

  const pix = await abacatepay.checkPixQrCode(pixId);
  await updatePaymentStatus(pixId, pix.status);

  // PIX avulso é contribuição pontual: NÃO concede a feature de apoiador (os
  // benefícios recorrentes são exclusivos da assinatura mensal).
  return { status: pix.status };
}

async function startSubscription(userObject, { taxId }) {
  if (!MONTHLY_PRODUCT_ID) {
    throw new ServiceError({
      message: "O apoio mensal está indisponível no momento.",
      cause: "Variável de ambiente ABACATEPAY_MONTHLY_PRODUCT_ID ausente.",
    });
  }

  const cleanTaxId = normalizeTaxId(taxId);
  const customerId = await ensureCustomer(userObject, { taxId: cleanTaxId });
  const origin = webserver.origin;

  const subscription = await abacatepay.createSubscription({
    productId: MONTHLY_PRODUCT_ID,
    customerId,
    returnUrl: `${origin}/apoiar`,
    completionUrl: `${origin}/sessao?apoio=sucesso`,
  });

  await recordPayment({
    userId: userObject.id,
    method: "card",
    kind: "subscription",
    providerId: subscription.id,
    amountCents: null,
    status: subscription.status,
  });

  return { url: subscription.url };
}

// Processa um evento de webhook já validado. Idempotente: eventos repetidos
// (reentrega do AbacatePay) são ignorados. O evento só é marcado como
// processado APÓS o tratamento — assim, uma falha transitória devolve 500 e o
// AbacatePay reentrega (as operações de grant/revoke são idempotentes).
async function handleWebhookEvent(event) {
  if (await isEventProcessed(event.id)) {
    return { duplicate: true };
  }

  const data = event.data || {};
  const userId = await resolveUserId(data);

  let outcome;
  if (!userId) {
    console.warn(
      `[abacatepay] webhook ${event.event} sem usuário correspondente (${event.id})`,
    );
    outcome = { unmatched: true };
  } else if (event.event === "subscription.cancelled") {
    await revokeSupporter(userId);
    outcome = { revoked: true };
  } else if (PAID_EVENT.test(event.event)) {
    if (data.id) {
      await updatePaymentStatus(data.id, "PAID");
    }
    // A feature de apoiador é concedida apenas por assinatura mensal. O PIX
    // avulso é contribuição pontual e NÃO dá os benefícios recorrentes.
    const grantsBenefit = await isSubscriptionPayment(event.event, data);
    if (grantsBenefit) {
      await supporter.grant(userId);
    }
    outcome = { paid: true, granted: grantsBenefit };
  } else {
    outcome = { ignored: event.event };
  }

  await recordEvent(event.id, event.event);
  return outcome;
}

// Distingue pagamento de assinatura (concede benefícios) de PIX avulso (não
// concede). A cobrança que registramos é a fonte da verdade e é consultada
// PRIMEIRO: um PIX avulso é sempre gravado como `one_time`, então nunca concede
// benefícios — não importa o nome do evento que o AbacatePay envie. Só quando
// não há cobrança correspondente recorremos ao nome do evento (o checkout
// hospedado e os eventos subscription.* são exclusivos da assinatura; o PIX
// avulso usa apenas pixQrCode). Na dúvida, não concede.
async function isSubscriptionPayment(eventName, data) {
  if (data.id) {
    const payment = await findPaymentByProviderId(data.id);
    if (payment) return payment.kind === "subscription";
  }
  if (/^subscription\./.test(eventName)) return true;
  if (eventName === "checkout.completed") return true;
  return false;
}

async function revokeSupporter(userId) {
  await supporter.revoke(userId);

  const result = await database.query({
    text: `SELECT discord_user_id FROM users WHERE id = $1;`,
    values: [userId],
  });
  const discordUserId = result.rows[0]?.discord_user_id;
  if (discordUserId) {
    try {
      await discord.removeSupporterRole(discordUserId);
    } catch (error) {
      console.error("[abacatepay] falha ao remover cargo do Discord:", error);
    }
  }
}

// Mapeia o evento de volta ao usuário: primeiro pelo cliente AbacatePay,
// depois pela cobrança registrada, por fim pelo e-mail.
async function resolveUserId(data) {
  const customerId = data.customer?.id || data.customerId;
  if (customerId) {
    const byCustomer = await database.query({
      text: `SELECT id FROM users WHERE abacatepay_customer_id = $1 LIMIT 1;`,
      values: [customerId],
    });
    if (byCustomer.rows[0]) return byCustomer.rows[0].id;
  }

  if (data.id) {
    const payment = await findPaymentByProviderId(data.id);
    if (payment) return payment.user_id;
  }

  const email = data.customer?.metadata?.email || data.customer?.email;
  if (email) {
    const byEmail = await database.query({
      text: `SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1;`,
      values: [email],
    });
    if (byEmail.rows[0]) return byEmail.rows[0].id;
  }

  return null;
}

async function recordPayment({
  userId,
  method,
  kind,
  providerId,
  amountCents,
  status,
}) {
  await database.query({
    text: `
      INSERT INTO supporter_payments
        (user_id, method, kind, provider_id, amount_cents, status)
      VALUES
        ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (provider_id) DO UPDATE
        SET status = EXCLUDED.status, updated_at = timezone('utc', now())
    ;`,
    values: [userId, method, kind, providerId, amountCents, status],
  });
}

async function updatePaymentStatus(providerId, status) {
  await database.query({
    text: `
      UPDATE supporter_payments
      SET status = $2, updated_at = timezone('utc', now())
      WHERE provider_id = $1
    ;`,
    values: [providerId, status],
  });
}

async function findPaymentByProviderId(providerId) {
  const result = await database.query({
    text: `SELECT * FROM supporter_payments WHERE provider_id = $1 LIMIT 1;`,
    values: [providerId],
  });
  return result.rows[0] || null;
}

async function isEventProcessed(eventId) {
  const result = await database.query({
    text: `SELECT 1 FROM abacatepay_webhook_events WHERE event_id = $1 LIMIT 1;`,
    values: [eventId],
  });
  return result.rowCount > 0;
}

async function recordEvent(eventId, event) {
  await database.query({
    text: `
      INSERT INTO abacatepay_webhook_events (event_id, event)
      VALUES ($1, $2)
      ON CONFLICT (event_id) DO NOTHING
    ;`,
    values: [eventId, event],
  });
}

const contribution = {
  startPix,
  checkPix,
  startSubscription,
  handleWebhookEvent,
};

export default contribution;
