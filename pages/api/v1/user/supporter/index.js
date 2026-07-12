import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import authorization from "models/authorization.js";
import supporter from "models/supporter.js";
import { ValidationError } from "infra/errors.js";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .patch(controller.canRequest("apoiador"), patchHandler)
  .handler(controller.errorHandlers);

async function patchHandler(request, response) {
  const userTryingToPatch = request.context.user;
  const wallOptIn = request.body?.wall_opt_in;

  if (typeof wallOptIn !== "boolean") {
    throw new ValidationError({
      message: "É necessário informar `wall_opt_in` como booleano.",
      action: "Envie `wall_opt_in` com o valor true ou false.",
    });
  }

  const updatedUser = await supporter.setWallOptIn(
    userTryingToPatch.id,
    wallOptIn,
  );

  const secureOutputValues = authorization.filterOutput(
    userTryingToPatch,
    "read:user:self",
    updatedUser,
  );

  response.setHeader(
    "Cache-Control",
    "no-store, no-cache, max-age=0, must-revalidate",
  );
  return response.status(200).json(secureOutputValues);
}
