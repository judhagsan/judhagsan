import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import supporter from "models/supporter.js";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .get(controller.canRequest("read:session"), getHandler)
  .handler(controller.errorHandlers);

// O SDK do Mercado Pago tokeniza o cartão no browser e precisa da public key
// para isso. Ela é pública por definição — o access token, que assina as
// requisições, nunca sai do servidor.
async function getHandler(request, response) {
  return response.status(200).json({
    public_key: process.env.MERCADOPAGO_PUBLIC_KEY || null,
    monthly_value: supporter.MONTHLY_VALUE,
  });
}
