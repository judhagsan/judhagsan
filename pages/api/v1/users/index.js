import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user.js";
import activation from "models/activation.js";
import auditLog from "models/auditLog.js";
import authorization from "models/authorization.js";
import { ValidationError } from "infra/errors.js";

const GENERIC_SIGNUP_RESPONSE = {
  message:
    "Se este email ainda não estava cadastrado, enviamos um link de ativação. Verifique sua caixa de entrada.",
};

const DUPLICATE_EMAIL_MESSAGE = "O email informado já está sendo utilizado.";

const NO_STORE = "no-store, no-cache, max-age=0, must-revalidate";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .get(controller.canRequest("read:user:all"), getHandler)
  .post(
    controller.rateLimit({
      key: "signup",
      limit: 5,
      windowMs: 60 * 60 * 1000,
    }),
    controller.canRequest("create:user"),
    postHandler,
  )
  .handler(controller.errorHandlers);

async function getHandler(request, response) {
  const userTryingToList = request.context.user;

  const listing = await user.listAll({
    limit: request.query.limit,
    offset: request.query.offset,
  });

  const secureOutputValues = authorization.filterOutput(
    userTryingToList,
    "read:user:all",
    listing.users,
  );

  // Listagem da base inteira não pode encostar em cache de CDN nem de browser.
  response.setHeader("Cache-Control", NO_STORE);

  return response.status(200).json({
    total: listing.total,
    limit: listing.limit,
    offset: listing.offset,
    users: secureOutputValues,
  });
}

async function postHandler(request, response) {
  const userInputValues = request.body;
  const ip = controller.getClientIp(request);

  let newUser;
  try {
    newUser = await user.create(userInputValues);
  } catch (error) {
    if (
      error instanceof ValidationError &&
      error.message === DUPLICATE_EMAIL_MESSAGE
    ) {
      try {
        const existingUser = await user.findOneByEmail(userInputValues.email);
        await activation.sendDuplicateAccountNoticeToUser(existingUser);
        await auditLog.record({
          action: "user.signup_duplicate_email",
          targetUserId: existingUser.id,
          ip,
        });
      } catch {
        // best-effort: silenciar para não revelar status via diferenças
      }
      return response.status(201).json(GENERIC_SIGNUP_RESPONSE);
    }
    throw error;
  }

  const activationToken = await activation.create(newUser.id);
  await activation.sendEmailToUser(newUser, activationToken);

  await auditLog.record({
    action: "user.created",
    actorUserId: newUser.id,
    targetUserId: newUser.id,
    ip,
  });

  return response.status(201).json(GENERIC_SIGNUP_RESPONSE);
}
