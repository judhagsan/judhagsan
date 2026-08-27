import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import pindoramaRelease from "models/pindoramaRelease.js";

// Download do instalador da build de PR mais recente. Espelha
// `/api/v1/download/[platform]` (release estável), com duas diferenças:
//
// 1. Exige `admin` E `apoiador` — o release estável é público, este não.
// 2. Resolve o asset no prerelease `pr-*` mais recente em vez do
//    `releases/latest`, que por definição ignora prereleases.
//
// O redirect leva a uma URL assinada e efêmera do GitHub: o repositório é
// privado e o token nunca chega ao cliente.
export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .get(
    controller.canRequest("admin"),
    controller.canRequest("apoiador"),
    getHandler,
  )
  .handler(controller.errorHandlers);

async function getHandler(request, response) {
  const platform = String(request.query.platform || "").toLowerCase();
  const signedUrl = await pindoramaRelease.prereleaseDownloadUrl(platform);

  response.setHeader("Cache-Control", "no-store");
  return response.redirect(302, signedUrl);
}
