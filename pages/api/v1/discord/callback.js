import * as cookie from "cookie";
import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import authorization from "models/authorization.js";
import auditLog from "models/auditLog.js";
import discord from "models/discord.js";
import supporter from "models/supporter.js";
import { ValidationError } from "infra/errors.js";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .get(getHandler)
  .handler(controller.errorHandlers);

// Alvo do redirect do Discord: como é uma navegação de browser, os erros
// voltam como redirect para /sessao com query params em vez de JSON.
async function getHandler(request, response) {
  const expectedState = request.cookies?.discord_oauth_state;
  clearStateCookie(response);

  const userTryingToConnect = request.context.user;

  if (!authorization.can(userTryingToConnect, "apoiador")) {
    return redirectWithResult(response, "error", "forbidden");
  }

  const { code, state } = request.query;

  if (!code || !state || !expectedState || state !== expectedState) {
    return redirectWithResult(response, "error", "invalid_state");
  }

  try {
    const accessToken = await discord.exchangeCodeForToken(code);
    const profile = await discord.fetchProfile(accessToken);
    await discord.addToGuildWithSupporterRole(profile.id, accessToken);
    await supporter.setDiscordId(userTryingToConnect.id, profile.id);

    await auditLog.record({
      action: "discord.connected",
      actorUserId: userTryingToConnect.id,
      targetUserId: userTryingToConnect.id,
      ip: controller.getClientIp(request),
    });

    return redirectWithResult(response, "connected");
  } catch (error) {
    console.error({
      name: error?.name,
      message: error?.message,
      cause: error?.cause,
    });

    const reason =
      error instanceof ValidationError ? "already_linked" : "discord_error";
    return redirectWithResult(response, "error", reason);
  }
}

function clearStateCookie(response) {
  response.setHeader(
    "Set-Cookie",
    cookie.serialize("discord_oauth_state", "invalid", {
      path: "/api/v1/discord",
      maxAge: -1,
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
    }),
  );
}

function redirectWithResult(response, result, reason) {
  const params = new URLSearchParams({ discord: result });

  if (reason) {
    params.set("reason", reason);
  }

  return response.redirect(302, `/sessao?${params}`);
}
