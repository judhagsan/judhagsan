import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import releaseAnnouncement from "models/releaseAnnouncement.js";
import auditLog from "models/auditLog.js";

const NO_STORE = "no-store, no-cache, max-age=0, must-revalidate";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .post(controller.canRequest("send:release_email"), postHandler)
  .handler(controller.errorHandlers);

async function postHandler(request, response) {
  const actor = request.context.user;
  const input = request.body || {};

  const before = await releaseAnnouncement.findOneById(request.query.id);
  const result = await releaseAnnouncement.sendBatch(request.query.id, {
    batchSize: input.batch_size,
    retryFailed: Boolean(input.retry_failed),
  });

  if (before.status === "draft" && result.announcement.status !== "draft") {
    await auditLog.record({
      action: "release_announcement.send_started",
      actorUserId: actor.id,
      ip: controller.getClientIp(request),
    });
  }

  if (result.announcement.status === "sent" && before.status !== "sent") {
    await auditLog.record({
      action: "release_announcement.send_completed",
      actorUserId: actor.id,
      ip: controller.getClientIp(request),
    });
  }

  response.setHeader("Cache-Control", NO_STORE);
  return response.status(200).json(result);
}
