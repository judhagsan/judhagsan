import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user.js";
import auditLog from "models/auditLog.js";

const NO_STORE = "no-store, no-cache, max-age=0, must-revalidate";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .patch(controller.canRequest("update:user"), patchHandler)
  .handler(controller.errorHandlers);

async function patchHandler(request, response) {
  const currentUser = request.context.user;
  const input = request.body || {};

  const updatedUser = await user.updateReleaseEmailPreference(
    currentUser.id,
    input.release_emails_enabled,
  );

  await auditLog.record({
    action: updatedUser.release_emails_enabled
      ? "user.release_emails_enabled"
      : "user.release_emails_disabled",
    actorUserId: currentUser.id,
    targetUserId: currentUser.id,
    ip: controller.getClientIp(request),
  });

  response.setHeader("Cache-Control", NO_STORE);
  return response.status(200).json({
    release_emails_enabled: Boolean(updatedUser.release_emails_enabled),
  });
}
