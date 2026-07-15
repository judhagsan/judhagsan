import crypto from "node:crypto";
import * as cookie from "cookie";
import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import discord from "models/discord.js";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .get(controller.canRequest("apoiador"), getHandler)
  .handler(controller.errorHandlers);

async function getHandler(request, response) {
  // `state` protege o callback contra CSRF: o valor gerado aqui precisa
  // voltar intacto do Discord e bater com o cookie.
  const state = crypto.randomBytes(16).toString("hex");

  response.setHeader(
    "Set-Cookie",
    cookie.serialize("discord_oauth_state", state, {
      path: "/api/v1/discord",
      maxAge: 600,
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
    }),
  );

  return response.redirect(302, discord.getAuthorizationUrl(state));
}
