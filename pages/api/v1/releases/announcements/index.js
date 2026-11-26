import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import releaseAnnouncement from "models/releaseAnnouncement.js";
import auditLog from "models/auditLog.js";

const NO_STORE = "no-store, no-cache, max-age=0, must-revalidate";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .get(controller.canRequest("send:release_email"), getHandler)
  .post(controller.canRequest("send:release_email"), postHandler)
  .handler(controller.errorHandlers);

async function getHandler(request, response) {
  const listing = await releaseAnnouncement.listAll({
    limit: request.query.limit,
  });

  response.setHeader("Cache-Control", NO_STORE);
  return response.status(200).json(listing);
}

async function postHandler(request, response) {
  const actor = request.context.user;
  const input = request.body || {};

  const created = await releaseAnnouncement.create({
    kind: input.kind,
    tag: input.tag,
    subject: input.subject,
    body: input.body,
    actorUserId: actor.id,
  });

  await auditLog.record({
    action: "release_announcement.created",
    actorUserId: actor.id,
    ip: controller.getClientIp(request),
  });

  response.setHeader("Cache-Control", NO_STORE);
  return response.status(201).json(created);
}
