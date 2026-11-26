import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import emailMedia from "models/emailMedia.js";

export default createRouter()
  .get(getHandler)
  .head(getHandler)
  .handler(controller.errorHandlers);

async function getHandler(request, response) {
  const media = await emailMedia.findOne(request.query.id);
  const etag = `"${media.sha256}"`;
  response.setHeader("Content-Type", media.content_type);
  response.setHeader("Content-Disposition", "inline");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
  response.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  response.setHeader("ETag", etag);
  if (request.headers["if-none-match"] === etag)
    return response.status(304).end();
  response.setHeader("Content-Length", media.content.length);
  if (request.method === "HEAD") return response.status(200).end();
  // Encerra com os bytes originais para preservar nosso ETag de conteúdo.
  return response.status(200).end(media.content);
}
