import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import database from "infra/database.js";
import mercadopago from "models/mercadopago.js";
import supporter from "models/supporter.js";
import { NotFoundError } from "infra/errors.js";

export default createRouter()
  .post(postHandler)
  .handler(controller.errorHandlers);

// Webhook do Mercado Pago.
//
// Diferente do gateway anterior, aqui a notificação é assinada: o header
// `x-signature` traz um HMAC-SHA256 sobre o id do recurso, o `x-request-id` e
// o timestamp. Nada é processado sem essa validação passar — é o que impede
// alguém que descobriu a URL de forjar um "pagamento aprovado".
//
// Mesmo assim, o payload não decide nada sozinho: ele diz qual recurso mudou e
// o estado real vem de uma consulta à API.

// Folga sobre a data da próxima cobrança. O Mercado Pago retenta uma cobrança
// rejeitada por até 10 dias; a carência cobre essa régua para que ninguém
// perca o acesso enquanto a tentativa ainda está de pé.
const GRACE_PERIOD_IN_DAYS = 11;

// Renovação sem data de próxima cobrança na resposta cai neste prazo.
const DEFAULT_CYCLE_IN_DAYS = 30;

const APPROVED_STATUSES = ["approved", "accredited", "processed"];

async function postHandler(request, response) {
  const payload = request.body || {};

  const topic = payload.type || payload.topic || null;
  const resourceId = payload?.data?.id ? String(payload.data.id) : null;

  if (!topic || !resourceId) {
    return response.status(400).json({ error: "Notificação incompleta." });
  }

  const isValid = mercadopago.isValidSignature({
    signatureHeader: request.headers["x-signature"],
    requestId: request.headers["x-request-id"],
    dataId: resourceId,
  });

  if (!isValid) {
    // 401 sem registrar nada: notificação não assinada não é evento, é ruído.
    return response.status(401).json({ error: "Assinatura inválida." });
  }

  if (await wasAlreadyProcessed(topic, resourceId)) {
    return response.status(200).json({ status: "duplicado" });
  }

  const eventRecord = await recordEvent(payload, { topic, resourceId });

  try {
    const result = await handleEvent(topic, resourceId);
    // Só agora vira processado. Marcar antes significaria que uma falha aqui
    // nunca mais seria corrigida por uma reentrega.
    await markProcessed(eventRecord.id);

    return response.status(200).json(result);
  } catch (error) {
    // O recurso não existe mais (ou nunca existiu, como no simulador do
    // painel). Reentregar não resolveria, então o evento fecha aqui em vez de
    // ficar preso na fila de retentativa.
    if (error instanceof NotFoundError) {
      await markProcessed(eventRecord.id);
      return response.status(200).json({ status: "recurso_inexistente" });
    }

    await markFailed(eventRecord.id, error);
    throw error;
  }
}

async function handleEvent(topic, resourceId) {
  if (topic === "subscription_preapproval") {
    return await handleSubscription(resourceId);
  }

  if (topic === "subscription_authorized_payment") {
    return await handleAuthorizedPayment(resourceId);
  }

  if (topic === "payment") {
    return await handlePixPayment(resourceId);
  }

  return { status: "ignorado" };
}

// Criação, pausa e cancelamento da assinatura. Não concede benefício: quem
// concede é o pagamento, porque assinatura autorizada ainda não é dinheiro.
async function handleSubscription(preapprovalId) {
  const subscription = await mercadopago.getSubscription(preapprovalId);
  const userId = mercadopago.parseExternalReference(
    subscription?.external_reference,
  );

  if (!userId) {
    return { status: "sem_referencia" };
  }

  await supporter.setSubscription(userId, {
    preapprovalId,
    status: subscription?.status || null,
  });

  // Cancelar não tira o acesso na hora: quem já pagou o ciclo fica até o fim
  // dele, e o cron revoga quando `supporter_until` vencer.
  return { status: "assinatura_atualizada" };
}

// Cobrança de um ciclo da assinatura: é o evento que renova o apoio.
async function handleAuthorizedPayment(authorizedPaymentId) {
  const authorizedPayment =
    await mercadopago.getAuthorizedPayment(authorizedPaymentId);

  const preapprovalId = authorizedPayment?.preapproval_id;

  if (!preapprovalId) {
    return { status: "sem_assinatura" };
  }

  const subscription = await mercadopago.getSubscription(preapprovalId);
  const userId = mercadopago.parseExternalReference(
    subscription?.external_reference,
  );

  if (!userId) {
    return { status: "sem_referencia" };
  }

  await supporter.setSubscription(userId, {
    preapprovalId,
    status: subscription?.status || null,
  });

  if (!isApproved(authorizedPayment?.payment?.status)) {
    // Cobrança rejeitada não revoga: o Mercado Pago ainda vai retentar, e a
    // carência do `supporter_until` existe exatamente para cobrir isso.
    //
    // Mas avisa. Este é o único ponto do sistema que sabe que a cobrança
    // falhou, e ele roda quando ninguém está olhando a tela — uma hora depois
    // de assinar, ou um mês depois, no meio da noite.
    const notified = await notifyDeclineWithoutFailingTheEvent(userId);

    return { status: "cobranca_pendente", notified };
  }

  await supporter.grantUntil(userId, calculateValidUntil(subscription));

  return { status: "apoio_renovado" };
}

// Pix avulso pago por quem teve o cartão recusado. Vale um ciclo.
async function handlePixPayment(paymentId) {
  const payment = await mercadopago.getPayment(paymentId);

  if (!isApproved(payment?.status)) {
    return { status: "pagamento_nao_aprovado" };
  }

  const userId = mercadopago.parseExternalReference(
    payment?.external_reference,
  );

  if (!userId) {
    return { status: "sem_referencia" };
  }

  await supporter.grantUntil(
    userId,
    addDays(new Date(), DEFAULT_CYCLE_IN_DAYS),
  );

  return { status: "apoio_concedido" };
}

// O aviso é efeito colateral, não a razão do evento existir. Se o SMTP estiver
// fora, o benefício já foi tratado e reentregar a notificação não conserta
// e-mail — deixar o erro subir faria o Mercado Pago retentar o evento inteiro
// para sempre. Registra e segue.
async function notifyDeclineWithoutFailingTheEvent(userId) {
  try {
    return await supporter.notifyChargeDeclined(userId);
  } catch (error) {
    console.error({
      name: "SupporterNoticeError",
      userId,
      error: String(error?.message || error),
    });

    return false;
  }
}

function calculateValidUntil(subscription) {
  const nextPayment = subscription?.next_payment_date
    ? new Date(subscription.next_payment_date)
    : null;

  const base =
    nextPayment && !Number.isNaN(nextPayment.getTime())
      ? nextPayment
      : addDays(new Date(), DEFAULT_CYCLE_IN_DAYS);

  return addDays(base, GRACE_PERIOD_IN_DAYS);
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function isApproved(status) {
  return APPROVED_STATUSES.includes(String(status || "").toLowerCase());
}

async function wasAlreadyProcessed(topic, resourceId) {
  const results = await database.query({
    text: `
      SELECT
        id
      FROM
        mercadopago_webhook_events
      WHERE
        topic = $1
        AND resource_id = $2
        AND processed_at IS NOT NULL
      LIMIT
        1
      ;`,
    values: [topic, resourceId],
  });

  return results.rowCount > 0;
}

async function recordEvent(payload, { topic, resourceId }) {
  const results = await database.query({
    text: `
      INSERT INTO
        mercadopago_webhook_events (topic, action, resource_id, payload)
      VALUES
        ($1, $2, $3, $4)
      RETURNING
        *
      ;`,
    values: [topic, payload.action || null, resourceId, payload],
  });

  return results.rows[0];
}

async function markProcessed(eventId) {
  await database.query({
    text: `
      UPDATE
        mercadopago_webhook_events
      SET
        processed_at = timezone('utc', now()),
        error = NULL
      WHERE
        id = $1
      ;`,
    values: [eventId],
  });
}

async function markFailed(eventId, error) {
  await database.query({
    text: `
      UPDATE
        mercadopago_webhook_events
      SET
        error = $2
      WHERE
        id = $1
      ;`,
    values: [eventId, String(error?.message || error)],
  });
}
