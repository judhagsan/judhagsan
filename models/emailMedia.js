import { createHash } from "node:crypto";
import sharp from "sharp";
import { validate as isUuid } from "uuid";
import database from "infra/database.js";
import { ValidationError, NotFoundError } from "infra/errors.js";

const MAX_BYTES = 3_000_000;
const FORMATS = {
  png: "image/png",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
};

function invalidImage() {
  return new ValidationError({
    message: "O arquivo não é uma imagem válida.",
    action: "Escolha uma imagem PNG, JPG, WebP ou GIF de até 3 MB.",
  });
}

async function validateImage(content) {
  if (
    typeof content !== "string" ||
    !content.length ||
    content.length > Math.ceil(MAX_BYTES / 3) * 4 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(content)
  )
    throw invalidImage();
  const buffer = Buffer.from(content, "base64");
  if (
    !buffer.length ||
    buffer.length > MAX_BYTES ||
    buffer.toString("base64") !== content
  )
    throw invalidImage();
  let metadata;
  try {
    metadata = await sharp(buffer, {
      limitInputPixels: 40_000_000,
      failOn: "error",
    }).metadata();
  } catch {
    throw invalidImage();
  }
  const height = metadata.pageHeight || metadata.height;
  if (
    !FORMATS[metadata.format] ||
    !metadata.width ||
    !height ||
    metadata.width > 8192 ||
    height > 8192 ||
    metadata.width * height > 40_000_000 ||
    (metadata.pages || 1) > 2000
  )
    throw invalidImage();
  // Guarda os bytes originais: nenhum frame de GIF/WebP animado é descartado.
  return {
    buffer,
    contentType: FORMATS[metadata.format],
    width: metadata.width,
    height,
  };
}

async function create({ content, actorUserId }) {
  const image = await validateImage(content);
  const hash = createHash("sha256").update(image.buffer).digest("hex");
  const result = await database.query({
    text: `INSERT INTO email_media (content, content_type, byte_size, width, height, sha256, created_by_user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (sha256) DO UPDATE SET sha256 = EXCLUDED.sha256
      RETURNING id, content_type, byte_size, width, height`,
    values: [
      image.buffer,
      image.contentType,
      image.buffer.length,
      image.width,
      image.height,
      hash,
      actorUserId,
    ],
  });
  return result.rows[0];
}

async function findOne(id) {
  if (typeof id !== "string" || !isUuid(id))
    throw new NotFoundError({ message: "Imagem não encontrada." });
  const result = await database.query({
    text: "SELECT content, content_type, sha256 FROM email_media WHERE id = $1",
    values: [id],
  });
  if (!result.rowCount)
    throw new NotFoundError({ message: "Imagem não encontrada." });
  return result.rows[0];
}

export default { create, findOne, validateImage, MAX_BYTES };
