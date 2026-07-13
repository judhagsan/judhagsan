import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import contribution from "models/contribution.js";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .post(controller.canRequest("read:session"), postHandler)
  .handler(controller.errorHandlers);

async function postHandler(request, response) {
  const userTryingToSupport = request.context.user;
  const { amount_cents, tax_id } = request.body || {};

  const pix = await contribution.startPix(userTryingToSupport, {
    amountCents: Number(amount_cents),
    taxId: tax_id,
  });

  response.setHeader("Cache-Control", "no-store");
  return response.status(201).json(pix);
}
