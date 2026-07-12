import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import supporter from "models/supporter.js";

export default createRouter().get(getHandler).handler(controller.errorHandlers);

// Endpoint público: alimenta o mural do site e a tela de créditos do Pindorama.
async function getHandler(request, response) {
  const supporters = await supporter.listPublic();

  response.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
  return response.status(200).json({ supporters });
}
