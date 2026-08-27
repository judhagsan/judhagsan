import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import pindoramaRelease from "models/pindoramaRelease.js";

// Builds de PR do Pindorama: o instalador que sai do workflow disparado pela
// label `build` num PR aberto.
//
// Existe para quem TESTA o app antes do release — não é um canal de
// atualização. Por isso a resposta não traz versão semântica: uma build de PR
// pode ter a mesma versão do release instalado, ou até uma menor, e mesmo
// assim ser a que a pessoa quer instalar naquele momento.
//
// Duas features exigidas, encadeadas: `admin` (é build interna, sem
// compromisso de estabilidade) E `apoiador` (o acesso antecipado é parte do
// que se recebe por apoiar). Ter só uma das duas não basta — são perguntas
// diferentes, e o `canRequest` de cada uma responde a sua.
export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .get(
    controller.canRequest("admin"),
    controller.canRequest("apoiador"),
    getHandler,
  )
  .handler(controller.errorHandlers);

async function getHandler(request, response) {
  const summary = await pindoramaRelease.prereleaseSummary();

  // Sem cache: o prerelease aparece e some conforme a label entra e o PR
  // fecha, e o botão no app precisa refletir isso na próxima checagem.
  response.setHeader("Cache-Control", "no-store");
  return response.status(200).json(summary);
}
