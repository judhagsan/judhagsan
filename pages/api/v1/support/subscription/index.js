import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import contribution from "models/contribution.js";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .post(controller.canRequest("read:session"), postHandler)
  .handler(controller.errorHandlers);

async function postHandler(request, response) {
  const userTryingToSubscribe = request.context.user;

  const result = await contribution.startSubscription(userTryingToSubscribe);

  response.setHeader("Cache-Control", "no-store");
  return response.status(201).json(result);
}
