import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user.js";
import auditLog from "models/auditLog.js";

const NO_STORE = "no-store, no-cache, max-age=0, must-revalidate";

// Endpoint público (sem sessão) para descadastro em 1 clique: atende tanto a
// página `/descadastrar/[token]` quanto o `List-Unsubscribe-Post` (RFC 8058)
// disparado por clientes como Gmail e Apple Mail.
export default createRouter()
  .post(
    controller.rateLimit({
      key: "email-unsubscribe",
      limit: 20,
      windowMs: 60 * 60 * 1000,
    }),
    postHandler,
  )
  .handler(controller.errorHandlers);

async function postHandler(request, response) {
  const updatedUser = await user.unsubscribeReleaseEmailsByToken(
    request.query.token,
  );

  await auditLog.record({
    action: "user.release_emails_unsubscribed",
    targetUserId: updatedUser.id,
    ip: controller.getClientIp(request),
  });

  // Não devolve email nem username: qualquer pessoa que tivesse o link só
  // precisa saber que o descadastro foi aplicado.
  response.setHeader("Cache-Control", NO_STORE);
  return response.status(200).json({
    unsubscribed: true,
    release_emails_enabled: false,
  });
}
