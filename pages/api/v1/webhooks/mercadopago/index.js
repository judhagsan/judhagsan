import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import database from "infra/database.js";
import mercadopago from "models/mercadopago.js";
import supporter from "models/supporter.js";
import user from "models/user.js";
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

// Recusa de verdade, a que encerra a tentativa. O que fica de fora importa
// tanto quanto: `pending` e `in_process` são cobrança em andamento, e tratá-las
// como recusa — que era o efeito de "tudo que não é aprovado" — fazia o sistema
// avisar por e-mail que falhou uma cobrança que estava só a caminho.
const DECLINED_STATUSES = ["rejected", "cancelled"];

// O dinheiro voltou. `refunded` é estorno que partiu de nós; `charged_back` é
// contestação que o emissor do cartão reverteu à força. Nos dois não há ciclo
// pago para honrar, então o apoio acaba na hora em vez de rodar até vencer.
// `in_mediation` fica de fora de propósito: disputa aberta é valor retido com
// desfecho desconhecido, e aí esperar é a resposta certa.
const CHARGEBACK_STATUS = "charged_back";

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
    return await handlePayment(resourceId);
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

  const paymentStatus = authorizedPayment?.payment?.status;

  if (isReversed(authorizedPayment?.payment)) {
    await endSupportForReversal(userId, authorizedPayment?.payment);

    return { status: "cobranca_estornada" };
  }

  if (isDeclined(paymentStatus)) {
    // Recusa não revoga: o Mercado Pago ainda vai retentar, e a carência do
    // `supporter_until` existe exatamente para cobrir isso. Mas registra e
    // avisa — este é o único ponto do sistema que sabe que a cobrança falhou,
    // e ele roda quando ninguém está olhando a tela.
    await supporter.markChargeDeclined(userId);
    const notified = await notifyDeclineWithoutFailingTheEvent(userId);

    return { status: "cobranca_recusada", notified };
  }

  if (!isApproved(paymentStatus)) {
    // Em andamento (`pending`, `in_process`): não concede, não alarma, não
    // avisa. O desfecho chega em outra notificação.
    return { status: "cobranca_em_andamento" };
  }

  await supporter.grantUntil(userId, calculateValidUntil(subscription));

  return { status: "apoio_renovado" };
}

// Qualquer pagamento aprovado — o Pix avulso e também a cobrança do cartão da
// assinatura, porque o Mercado Pago notifica as duas coisas neste mesmo tópico.
//
// É por isso que este handler não pode assumir Pix: assumindo, ele concedia 30
// dias corridos para uma cobrança de assinatura que o
// `subscription_authorized_payment` já concede pelo calendário do preapproval.
// Duas rotas concediam o mesmo benefício com contas diferentes, e quem chegasse
// por último ganhava.
async function handlePayment(paymentId) {
  const payment = await mercadopago.getPayment(paymentId);
  const reversed = isReversed(payment);

  // Antes da checagem de aprovação: um pagamento estornado não está aprovado,
  // e sem isto ele sairia por "não aprovado" sem que ninguém desfizesse o
  // benefício que a aprovação anterior concedeu.
  if (reversed) {
    const reversedUserId = mercadopago.parseExternalReference(
      payment?.external_reference,
    );

    if (!reversedUserId) {
      return { status: "sem_referencia" };
    }

    await endSupportForReversal(reversedUserId, payment);

    return { status: "pagamento_estornado" };
  }

  if (!isApproved(payment?.status)) {
    return { status: "pagamento_nao_aprovado" };
  }

  if (isCardValidation(payment)) {
    return { status: "validacao_de_cartao" };
  }

  const userId = mercadopago.parseExternalReference(
    payment?.external_reference,
  );

  if (!userId) {
    return { status: "sem_referencia" };
  }

  await supporter.grantUntil(userId, await calculatePaidUntil(payment, userId));

  return { status: "apoio_concedido" };
}

// Até quando um pagamento aprovado paga.
//
// Pix compra um ciclo solto, contado de hoje. Cartão é cobrança de assinatura,
// e aí o calendário é o do preapproval — a mesma conta do
// `subscription_authorized_payment`, para as duas rotas convergirem no mesmo
// valor em vez de disputarem o `supporter_until`.
async function calculatePaidUntil(payment, userId) {
  if (isPix(payment)) {
    return addDays(new Date(), DEFAULT_CYCLE_IN_DAYS);
  }

  const payingUser = await user.findOneById(userId);
  const preapprovalId = payingUser?.mercadopago_preapproval_id;

  if (!preapprovalId) {
    return addDays(new Date(), DEFAULT_CYCLE_IN_DAYS);
  }

  try {
    return calculateValidUntil(
      await mercadopago.getSubscription(preapprovalId),
    );
  } catch (error) {
    // Assinatura sumida não pode custar o benefício de quem pagou: cai no
    // ciclo padrão. Mercado Pago fora do ar é outra coisa — deixa subir, para
    // a reentrega tentar de novo em vez de conceder um prazo chutado.
    if (!(error instanceof NotFoundError)) {
      throw error;
    }

    return addDays(new Date(), DEFAULT_CYCLE_IN_DAYS);
  }
}

function isPix(payment) {
  return (
    payment?.payment_method_id === "pix" ||
    payment?.payment_type_id === "bank_transfer"
  );
}

// Encerra o apoio e, no caso de chargeback, para de cobrar.
//
// Continuar cobrando quem contestou uma cobrança rende mais contestações — e
// chargeback recorrente é o que o adquirente olha. O cancelamento é tentado
// depois da revogação e não pode derrubar o evento: se o Mercado Pago já
// cancelou sozinho, um segundo cancelamento falha, e deixar esse erro subir
// prenderia a notificação em retentativa eterna.
async function endSupportForReversal(userId, payment) {
  await supporter.revokeNow(userId);

  if (String(payment?.status || "").toLowerCase() !== CHARGEBACK_STATUS) {
    return;
  }

  const chargedBackUser = await user.findOneById(userId);
  const preapprovalId = chargedBackUser?.mercadopago_preapproval_id;

  if (!preapprovalId) {
    return;
  }

  try {
    const subscription = await mercadopago.cancelSubscription(preapprovalId);

    await supporter.setSubscription(userId, {
      preapprovalId,
      status: subscription?.status || null,
    });
  } catch (error) {
    console.error({
      name: "SubscriptionCancelError",
      userId,
      preapprovalId,
      error: String(error?.message || error),
    });
  }
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

function isDeclined(status) {
  return DECLINED_STATUSES.includes(String(status || "").toLowerCase());
}

// A validação que o Mercado Pago faz ao criar a assinatura: cobra R$ 0,00 só
// para saber se o cartão existe. Chega aqui aprovada e sem referência, e não
// compra ciclo nenhum.
//
// A checagem principal é o `operation_type`, que é o que o Mercado Pago
// devolveu de verdade nessa cobrança em produção. O valor entra só como
// reserva, e com igualdade estrita: campo ausente **não** conta como zero.
// Inferir ausência como zero recusaria o benefício a quem pagou, que é o único
// erro caro que esta função pode cometer.
function isCardValidation(payment) {
  const operation = String(payment?.operation_type || "").toLowerCase();

  return operation === "card_validation" || payment?.transaction_amount === 0;
}

// Estorno parcial não desfaz o ciclo: devolver R$ 2 de um apoio de R$ 9,90 é
// cortesia, não cancelamento. Só encerra quem devolveu tudo. Sem os campos
// para comparar, o status manda — é o dado mais confiável que temos.
function isReversed(payment) {
  const status = String(payment?.status || "").toLowerCase();

  if (status === CHARGEBACK_STATUS) {
    return true;
  }

  if (status !== "refunded") {
    return false;
  }

  const total = Number(payment?.transaction_amount);
  const refunded = Number(payment?.transaction_amount_refunded);

  if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(refunded)) {
    return true;
  }

  return refunded >= total;
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
