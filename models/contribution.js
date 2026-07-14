import database from "infra/database.js";
import webserver from "infra/webserver.js";
import abacatepay from "models/abacatepay.js";
import supporter from "models/supporter.js";
import discord from "models/discord.js";
import { ServiceError } from "infra/errors.js";

const MONTHLY_PRODUCT_ID = process.env.ABACATEPAY_MONTHLY_PRODUCT_ID;

// Eventos que confirmam pagamento e concedem a feature de apoiador
// (subscription.completed na ativação, subscription.renewed a cada mês pago).
const PAID_EVENT = /\.(paid|completed|renewed)$/;

// Eventos que encerram a assinatura e revogam o benefício. Cobrimos o
// cancelamento (único documentado hoje) e possíveis variantes terminais
// (expiração/suspensão). NÃO revogamos numa falha pontual de cobrança: o
// retryPolicy do AbacatePay ainda pode recuperar o pagamento nas tentativas
// seguintes — só o encerramento definitivo tira o benefício.
const REVOKE_EVENT =
  /^subscription\.(cancelled|canceled|expired|suspended|ended)$/;

async function startSubscription(userObject) {
  if (!MONTHLY_PRODUCT_ID) {
    throw new ServiceError({
      message: "O apoio mensal está indisponível no momento.",
      cause: "Variável de ambiente ABACATEPAY_MONTHLY_PRODUCT_ID ausente.",
    });
  }

  // O checkout hospedado do AbacatePay coleta nome, CPF, endereço e cartão —
  // não precisamos pedir nada disso antes do redirecionamento.
  const origin = webserver.origin;

  const subscription = await abacatepay.createSubscription({
    productId: MONTHLY_PRODUCT_ID,
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
  console.log("[abacatepay webhook] resolveUserId", {
    event: event.event,
    dataId: data.id,
    userId: userId || null,
  });

  let outcome;
  if (!userId) {
    console.warn(
      `[abacatepay] webhook ${event.event} sem usuário correspondente (${event.id})`,
    );
    outcome = { unmatched: true };
  } else if (REVOKE_EVENT.test(event.event)) {
    await revokeSupporter(userId);
    outcome = { revoked: true };
  } else if (PAID_EVENT.test(event.event)) {
    if (data.id) {
      await updatePaymentStatus(data.id, "PAID");
    }
    // Só existe assinatura recorrente; qualquer pagamento confirmado concede
    // (ou mantém) o apoiador. grant é idempotente, então renovações mensais
    // apenas reafirmam o benefício.
    await supporter.grant(userId);
    outcome = { paid: true, granted: true };
  } else {
    outcome = { ignored: event.event };
  }

  await recordEvent(event.id, event.event);
  return outcome;
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
  startSubscription,
  handleWebhookEvent,
};

export default contribution;
