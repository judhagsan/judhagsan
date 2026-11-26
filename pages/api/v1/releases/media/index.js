import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import webserver from "infra/webserver.js";
import emailMedia from "models/emailMedia.js";
import auditLog from "models/auditLog.js";

export const config = { api: { bodyParser: { sizeLimit: "4mb" } } };

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .post(controller.canRequest("send:release_email"), postHandler)
  .handler(controller.errorHandlers);

async function postHandler(request, response) {
  const media = await emailMedia.create({
    content: request.body?.content,
    actorUserId: request.context.user.id,
  });
  await auditLog.record({
    action: "email_media.created",
    actorUserId: request.context.user.id,
    ip: controller.getClientIp(request),
  });
  response.setHeader("Cache-Control", "no-store");
  return response.status(201).json({
    ...media,
    url: `${webserver.origin}/api/v1/releases/media/${media.id}`,
  });
}
