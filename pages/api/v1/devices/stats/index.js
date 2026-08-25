import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import userDevice from "models/userDevice.js";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .get(controller.canRequest("read:device:all"), getHandler)
  .handler(controller.errorHandlers);

async function getHandler(request, response) {
  const stats = await userDevice.stats({ limit: request.query.limit });

  /*
   * Agregado não é anônimo por definição: com um dispositivo só na base, "o
   * monitor mais usado" é o monitor daquela pessoa. Mas o que sai daqui são
   * contagens por valor de hardware, sem `user_id`, sem `hardware_uuid` e sem
   * nada que ligue uma linha a uma conta — e a rota exige `read:device:all`.
   */
  response.setHeader(
    "Cache-Control",
    "no-store, no-cache, max-age=0, must-revalidate",
  );

  return response.status(200).json(stats);
}
