import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import mercadopago from "models/mercadopago.js";
import supporter from "models/supporter.js";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .post(controller.canRequest("read:session"), postHandler)
  .handler(controller.errorHandlers);

// Pix de reposição: existe para quem teve a cobrança do cartão recusada e quer
// manter o apoio sem esperar a próxima tentativa do Mercado Pago. Vale um
// ciclo e não renova nada — a assinatura no cartão segue seu curso.
async function postHandler(request, response) {
  const userTryingToPay = request.context.user;

  const order = await mercadopago.createPixOrder({
    userId: userTryingToPay.id,
    email: userTryingToPay.email,
    amount: supporter.MONTHLY_VALUE,
  });

  const payment = order?.transactions?.payments?.[0];
  const pix = payment?.payment_method;

  return response.status(201).json({
    order_id: order?.id || null,
    qr_code: pix?.qr_code || null,
    qr_code_base64: pix?.qr_code_base64 || null,
    ticket_url: pix?.ticket_url || null,
    expires_at: payment?.expiration_time || null,
  });
}
