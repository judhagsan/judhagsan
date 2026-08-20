import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import mercadopago from "models/mercadopago.js";
import supporter from "models/supporter.js";
import user from "models/user.js";
import { ValidationError, NotFoundError } from "infra/errors.js";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .post(controller.canRequest("read:session"), postHandler)
  .delete(controller.canRequest("read:session"), deleteHandler)
  .handler(controller.errorHandlers);

const REASON = "Apoio ao Pindorama";

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
