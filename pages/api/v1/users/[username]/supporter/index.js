import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user.js";
import supporter from "models/supporter.js";
import authorization from "models/authorization.js";
import auditLog from "models/auditLog.js";
import { ValidationError } from "infra/errors.js";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .put(controller.canRequest("manage:supporter"), putHandler)
  .delete(controller.canRequest("manage:supporter"), deleteHandler)
  .handler(controller.errorHandlers);

const NO_STORE = "no-store, no-cache, max-age=0, must-revalidate";

/*
 * `supporter_until` só existe quando o apoio veio de cobrança: `grantUntil()`
 * grava o fim do ciclo pago, e a concessão manual deixa nulo — é por isso que
 * `expireOverdue()` ignora quem não tem prazo.
 *
 * Então um prazo no futuro significa ciclo pago em andamento, e aí o botão do
 * painel não pode agir: tirar a feature não cancela a assinatura no Mercado
 * Pago. A cobrança seguiria, o próximo webhook devolveria o acesso, e no meio
 * disso alguém que paga teria ficado sem. Cancelar assinatura é outro fluxo,
 * pela própria pessoa em /sessao.
 */
function hasPaidCycleRunning(userFound) {
  return (
    Boolean(userFound.supporter_until) &&
    new Date(userFound.supporter_until) > new Date()
  );
}

async function putHandler(request, response) {
  const actor = request.context.user;
  const targetUser = await user.findOneByUsername(request.query.username);

  const updatedUser = await supporter.grant(targetUser.id);

  await auditLog.record({
    action: "user.supporter_granted",
    actorUserId: actor.id,
    targetUserId: targetUser.id,
    ip: controller.getClientIp(request),
  });

  response.setHeader("Cache-Control", NO_STORE);
  return response
    .status(200)
    .json(authorization.filterOutput(actor, "read:user", updatedUser));
}

async function deleteHandler(request, response) {
  const actor = request.context.user;
  const targetUser = await user.findOneByUsername(request.query.username);

  if (hasPaidCycleRunning(targetUser)) {
    throw new ValidationError({
      message: "Esta conta tem um ciclo de apoio pago em andamento.",
      action:
        "O cancelamento precisa partir da própria pessoa, em /sessao, para encerrar a cobrança.",
    });
  }

  const updatedUser = await supporter.revoke(targetUser.id);

  await auditLog.record({
    action: "user.supporter_revoked",
    actorUserId: actor.id,
    targetUserId: targetUser.id,
    ip: controller.getClientIp(request),
  });

  response.setHeader("Cache-Control", NO_STORE);
  return response
    .status(200)
    .json(authorization.filterOutput(actor, "read:user", updatedUser));
}
