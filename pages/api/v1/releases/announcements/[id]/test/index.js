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

  const result = await releaseAnnouncement.sendTest(request.query.id, {
    actorUser: actor,
    simulateSupporter: Boolean(input.simulate_supporter),
  });

  await auditLog.record({
    action: "release_announcement.tested",
    actorUserId: actor.id,
    ip: controller.getClientIp(request),
  });

  response.setHeader("Cache-Control", NO_STORE);
  return response.status(200).json(result);
}
