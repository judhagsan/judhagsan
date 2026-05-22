import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import userDevice from "models/userDevice.js";
import auditLog from "models/auditLog.js";
import { ValidationError } from "infra/errors.js";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .patch(controller.canRequest("manage:device"), patchHandler)
  .delete(controller.canRequest("manage:device"), deleteHandler)
  .handler(controller.errorHandlers);

async function patchHandler(request, response) {
  const userTryingToPatch = request.context.user;
  const deviceId = request.query.id;
  const body = request.body || {};

  if (typeof body.upload_paused !== "boolean") {
    throw new ValidationError({
      message: "O campo `upload_paused` é obrigatório e deve ser booleano.",
      action: 'Envie { "upload_paused": true } ou { "upload_paused": false }.',
    });
  }

  const updated = await userDevice.setPaused(
    deviceId,
    userTryingToPatch.id,
    body.upload_paused,
  );

  await auditLog.record({
    action: body.upload_paused ? "device.paused" : "device.resumed",
    actorUserId: userTryingToPatch.id,
    targetUserId: userTryingToPatch.id,
    ip: controller.getClientIp(request),
  });

  response.setHeader(
    "Cache-Control",
    "no-store, no-cache, max-age=0, must-revalidate",
  );
  return response.status(200).json(updated);
}

async function deleteHandler(request, response) {
  const userTryingToDelete = request.context.user;
  const deviceId = request.query.id;

  await userDevice.remove(deviceId, userTryingToDelete.id);

  await auditLog.record({
    action: "device.deleted",
    actorUserId: userTryingToDelete.id,
    targetUserId: userTryingToDelete.id,
    ip: controller.getClientIp(request),
  });

  return response.status(204).end();
}
