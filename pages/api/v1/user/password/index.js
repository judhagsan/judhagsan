import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user.js";
import password from "models/password.js";
import session from "models/session.js";
import auditLog from "models/auditLog.js";
import { ValidationError } from "infra/errors.js";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .post(
    controller.rateLimit({
      key: "password-change",
      limit: 5,
      windowMs: 15 * 60 * 1000,
    }),
    controller.canRequest("update:user"),
    postHandler,
  )
  .handler(controller.errorHandlers);

const NO_STORE = "no-store, no-cache, max-age=0, must-revalidate";

async function postHandler(request, response) {
  const { current_password, new_password } = request.body || {};
  const ip = controller.getClientIp(request);

  const sessionToken = request.cookies.session_id;
  const sessionObject = await session.findOneValidByToken(sessionToken);
  const storedUser = await user.findOneById(sessionObject.user_id);

  if (typeof current_password !== "string" || current_password.length === 0) {
    throw new ValidationError({
      message: "É necessário informar a senha atual.",
      action: "Preencha o campo de senha atual e tente novamente.",
    });
  }

  const currentPasswordMatches = await password.compare(
    current_password,
    storedUser.password,
  );

  if (!currentPasswordMatches) {
    await auditLog.record({
      action: "user.password_change_failed",
      actorUserId: storedUser.id,
      targetUserId: storedUser.id,
      ip,
    });

    // ValidationError e não UnauthorizedError de propósito: `onErrorHandler`
    // limpa o cookie de sessão em 401, e errar a senha atual não pode deslogar
    // quem está justamente tentando trocá-la.
    throw new ValidationError({
      message: "A senha atual não confere.",
      action: "Verifique a senha atual e tente novamente.",
    });
  }

  if (new_password === current_password) {
    throw new ValidationError({
      message: "A nova senha deve ser diferente da senha atual.",
      action: "Escolha uma senha que você ainda não usa nesta conta.",
    });
  }

  const updatedUser = await user.updatePasswordById(
    storedUser.id,
    new_password,
  );

  // Trocar a senha derruba as outras sessões: se alguém tinha acesso indevido
  // à conta, a troca precisa expulsá-lo. A sessão de quem trocou sobrevive e é
  // renovada, para não obrigar um login logo em seguida.
  await session.expireAllByUserId(updatedUser.id, {
    exceptSessionId: sessionObject.id,
  });
  const renewedSession = await session.renew(sessionObject.id);
  controller.setSessionCookie(renewedSession.token, response);

  await auditLog.record({
    action: "user.password_changed",
    actorUserId: updatedUser.id,
    targetUserId: updatedUser.id,
    ip,
  });

  // O aviso é o que permite a vítima reagir quando a troca não foi dela — não
  // existe recuperação por email neste sistema, então é o único sinal que ela
  // recebe. Mesmo assim não pode derrubar a resposta: a senha já mudou e as
  // sessões já caíram, e devolver erro faria o usuário achar que nada valeu.
  try {
    await password.sendChangedNoticeToUser(updatedUser);
  } catch (error) {
    console.error({
      name: "PasswordChangedNoticeError",
      underlyingErrorName: error?.name,
    });
  }

  response.setHeader("Cache-Control", NO_STORE);
  return response.status(200).json({
    id: updatedUser.id,
    username: updatedUser.username,
    updated_at: updatedUser.updated_at,
  });
}
