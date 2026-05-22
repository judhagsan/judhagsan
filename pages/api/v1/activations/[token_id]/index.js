import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import activation from "models/activation.js";
import authorization from "models/authorization.js";
import auditLog from "models/auditLog.js";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .patch(controller.canRequest("read:activation_token"), patchHandler)
  .handler(controller.errorHandlers);

async function patchHandler(request, response) {
  const userTryingToPatch = request.context.user;
  const activationTokenId = request.query.token_id;

  const validActivationToken =
    await activation.findOneValidById(activationTokenId);

  await activation.activateUserByUserId(validActivationToken.user_id);

  const usedActivationToken =
    await activation.markTokenAsUsed(activationTokenId);

  await auditLog.record({
    action: "user.activated",
    actorUserId: validActivationToken.user_id,
    targetUserId: validActivationToken.user_id,
    ip: controller.getClientIp(request),
  });

  const secureOutputValues = authorization.filterOutput(
    userTryingToPatch,
    "read:activation_token",
    usedActivationToken,
  );

  response.setHeader(
    "Cache-Control",
    "no-store, no-cache, max-age=0, must-revalidate",
  );
  return response.status(200).json(secureOutputValues);
}
