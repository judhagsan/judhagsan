import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user.js";
import authorization from "models/authorization.js";
import { ForbiddenError } from "infra/errors.js";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .get(getHandler)
  .patch(controller.canRequest("update:user"), patchHandler)
  .delete(controller.canRequest("delete:user"), deleteHandler)
  .handler(controller.errorHandlers);

async function getHandler(request, response) {
  const userTryingToGet = request.context.user;
  const username = request.query.username;
  const userFound = await user.findOneByUsername(username);

  const secureOutputValues = authorization.filterOutput(
    userTryingToGet,
    "read:user",
    userFound,
  );

  return response.status(200).json(secureOutputValues);
}

async function patchHandler(request, response) {
  const username = request.query.username;
  const userInputValues = request.body;

  const userTryingToPatch = request.context.user;
  const targetUser = await user.findOneByUsername(username);

  if (!authorization.can(userTryingToPatch, "update:user", targetUser)) {
    throw new ForbiddenError({
      message: "Você não possui permissão para atualizar outro usuário.",
      action:
        "Verifique se você possui a feature necessária para atualizar outro usuário.",
    });
  }

  const updatedUser = await user.update(username, userInputValues);

  const secureOutputValues = authorization.filterOutput(
    userTryingToPatch,
    "read:user",
    updatedUser,
  );

  return response.status(200).json(secureOutputValues);
}

async function deleteHandler(request, response) {
  const username = request.query.username;
  const userTryingToDelete = request.context.user;
  const targetUser = await user.findOneByUsername(username);

  if (!authorization.can(userTryingToDelete, "delete:user", targetUser)) {
    throw new ForbiddenError({
      message: "Você não possui permissão para excluir outro usuário.",
      action:
        "Verifique se você possui a feature necessária para excluir outro usuário.",
    });
  }

  await user.remove(username);

  if (userTryingToDelete.id === targetUser.id) {
    controller.clearSessionCookie(response);
  }

  return response.status(204).end();
}
