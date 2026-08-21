import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import mercadopago from "models/mercadopago.js";
import supporter from "models/supporter.js";
import user from "models/user.js";
import { ValidationError, NotFoundError, ServiceError } from "infra/errors.js";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .get(controller.canRequest("read:session"), getHandler)
  .post(controller.canRequest("read:session"), postHandler)
  .delete(controller.canRequest("read:session"), deleteHandler)
  .handler(controller.errorHandlers);

const REASON = "Apoio ao Pindorama";

// Estado da assinatura, para o card não deixar ninguém no escuro sobre o
// próprio dinheiro.
//
// A verdade vem do Mercado Pago, não do nosso banco: o webhook pode atrasar,
// ter falhado na entrega ou ainda nem ter sido disparado — e é exatamente
// nesse intervalo que a pessoa vem à tela conferir o que aconteceu. O banco
// fica como reserva para quando a API não responder, porque estado
// desatualizado ainda informa mais do que uma tela vazia.
async function getHandler(request, response) {
  const userTryingToRead = await user.findOneById(request.context.user.id);

  const state = {
    status: userTryingToRead.mercadopago_status || null,
    is_supporter: userTryingToRead.features.includes(supporter.FEATURE),
    supporter_until: userTryingToRead.supporter_until || null,
    next_payment_date: null,
    monthly_value: supporter.MONTHLY_VALUE,
  };

  if (!userTryingToRead.mercadopago_preapproval_id) {
    return response.status(200).json({ ...state, status: null });
  }

  try {
    const subscription = await mercadopago.getSubscription(
      userTryingToRead.mercadopago_preapproval_id,
    );

    state.status = subscription.status || state.status;
    state.next_payment_date = subscription.next_payment_date || null;
  } catch (error) {
    // Assinatura sumida do Mercado Pago, ou o Mercado Pago fora do ar. Nenhum
    // dos dois justifica derrubar a tela de quem só quer ver o próprio estado.
    if (!(error instanceof NotFoundError) && !(error instanceof ServiceError)) {
      throw error;
    }
  }

  return response.status(200).json(state);
}

// Cria a assinatura mensal no cartão. O cartão em si nunca chega aqui: o SDK
// do Mercado Pago tokeniza no browser e só o token de uso único viaja, o que
// mantém o servidor fora do escopo PCI.
async function postHandler(request, response) {
  const userTryingToSubscribe = request.context.user;
  const { card_token_id: cardTokenId } = request.body || {};

  if (!cardTokenId) {
    throw new ValidationError({
      message: "O cartão não foi informado.",
      action: "Preencha os dados do cartão e tente novamente.",
    });
  }

  const subscription = await mercadopago.createSubscription({
    userId: userTryingToSubscribe.id,
    email: userTryingToSubscribe.email,
    cardTokenId,
    amount: supporter.MONTHLY_VALUE,
    reason: REASON,
  });

  await supporter.setSubscription(userTryingToSubscribe.id, {
    preapprovalId: subscription.id,
    status: subscription.status,
  });

  // Quem concede o benefício é o webhook, quando a cobrança for aprovada — a
  // primeira sai em até uma hora. Aqui devolvemos só o estado para a tela.
  return response.status(201).json({
    subscription_id: subscription.id,
    status: subscription.status,
    next_payment_date: subscription.next_payment_date || null,
  });
}

// Cancela a assinatura. O acesso não cai na hora: quem já pagou o ciclo fica
// até o fim dele, e o cron revoga quando `supporter_until` vencer.
async function deleteHandler(request, response) {
  const userTryingToCancel = await user.findOneById(request.context.user.id);
  const preapprovalId = userTryingToCancel.mercadopago_preapproval_id;

  if (!preapprovalId) {
    throw new NotFoundError({
      message: "Você não possui uma assinatura ativa.",
      action: "Verifique se o apoio foi feito com esta conta.",
    });
  }

  const subscription = await mercadopago.cancelSubscription(preapprovalId);

  await supporter.setSubscription(userTryingToCancel.id, {
    preapprovalId,
    status: subscription.status,
  });

  return response.status(200).json({
    subscription_id: preapprovalId,
    status: subscription.status,
  });
}
