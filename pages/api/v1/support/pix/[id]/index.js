import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import contribution from "models/contribution.js";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .get(controller.canRequest("read:session"), getHandler)
  .handler(controller.errorHandlers);

async function getHandler(request, response) {
  const userTryingToCheck = request.context.user;
  const pixId = request.query.id;

  const result = await contribution.checkPix(userTryingToCheck, pixId);

  response.setHeader("Cache-Control", "no-store");
  return response.status(200).json(result);
}
