import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import releaseAnnouncement from "models/releaseAnnouncement.js";
import auditLog from "models/auditLog.js";

const NO_STORE = "no-store, no-cache, max-age=0, must-revalidate";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .get(controller.canRequest("send:release_email"), getHandler)
  .patch(controller.canRequest("send:release_email"), patchHandler)
  .delete(controller.canRequest("send:release_email"), deleteHandler)
  .handler(controller.errorHandlers);

async function getHandler(request, response) {
  const announcement = await releaseAnnouncement.findOneById(request.query.id);

  response.setHeader("Cache-Control", NO_STORE);
  return response.status(200).json(announcement);
}

async function patchHandler(request, response) {
  const actor = request.context.user;
  const input = request.body || {};

  const updated = await releaseAnnouncement.update(request.query.id, {
    tag: input.tag,
    subject: input.subject,
    body: input.body,
  });

  await auditLog.record({
    action: "release_announcement.updated",
    actorUserId: actor.id,
    ip: controller.getClientIp(request),
  });

  response.setHeader("Cache-Control", NO_STORE);
  return response.status(200).json(updated);
}

async function deleteHandler(request, response) {
  const actor = request.context.user;

  await releaseAnnouncement.removeDraft(request.query.id);

  await auditLog.record({
    action: "release_announcement.deleted",
    actorUserId: actor.id,
    ip: controller.getClientIp(request),
  });

  response.setHeader("Cache-Control", NO_STORE);
  return response.status(204).end();
}
