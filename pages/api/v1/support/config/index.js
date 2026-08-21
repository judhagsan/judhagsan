import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import mercadopago from "models/mercadopago.js";
import supporter from "models/supporter.js";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .get(controller.canRequest("read:session"), getHandler)
  .handler(controller.errorHandlers);

// O SDK do Mercado Pago tokeniza o cartão no browser e precisa da public key
// para isso. Ela é pública por definição — o access token, que assina as
// requisições, nunca sai do servidor.
//
// A chave vai validada: uma credencial revogada tem o mesmo formato de uma
// boa, e sem essa checagem o card só quebraria no envio do formulário. Vindo
// `null`, o CardApoiar já monta como indisponível.
async function getHandler(request, response) {
  return response.status(200).json({
    public_key: await mercadopago.getValidPublicKey(),
    monthly_value: supporter.MONTHLY_VALUE,
  });
}
