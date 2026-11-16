import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import pindoramaRelease from "models/pindoramaRelease.js";

export default createRouter().get(getHandler).handler(controller.errorHandlers);

async function getHandler(request, response) {
  const platform = String(request.query.platform || "").toLowerCase();
  const signedUrl = await pindoramaRelease.latestReleaseDownloadUrl(platform);

  response.setHeader("Cache-Control", "no-store");
  return response.redirect(302, signedUrl);
}
