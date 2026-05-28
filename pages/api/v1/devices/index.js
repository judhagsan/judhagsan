import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import userDevice from "models/userDevice.js";
import auditLog from "models/auditLog.js";
import { ValidationError } from "infra/errors.js";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .get(controller.canRequest("manage:device"), getHandler)
  .post(controller.canRequest("manage:device"), postHandler)
  .handler(controller.errorHandlers);

async function getHandler(request, response) {
  const userTryingToGet = request.context.user;
  const devices = await userDevice.findAllByUserId(userTryingToGet.id);

  response.setHeader(
    "Cache-Control",
    "no-store, no-cache, max-age=0, must-revalidate",
  );
  return response.status(200).json(devices);
}

async function postHandler(request, response) {
  const userTryingToPost = request.context.user;
  const body = request.body || {};

  // `hardware_uuid` é o fingerprint estável da máquina (ver migration
  // mais recente). Sem ele não há como deduplicar registros do mesmo
  // dispositivo após upgrade de SO/RAM/GPU.
  const hardwareUuid = sanitizeString(body.hardware_uuid, 64);
  const os = sanitizeString(body.os, 64);
  const cpu = sanitizeString(body.cpu, 128);
  const gpu = sanitizeString(body.gpu, 128);
  const pindoramaVersion = sanitizeString(body.pindorama_version, 32);
  const ramBytes = sanitizeBigint(body.ram_bytes);
  // Periféricos são opcionais: a mesa só é detectada quando o usuário
  // aproxima a caneta, e nem todo usuário tem uma. Monitor sempre existe
  // mas pode falhar a enumeração em headless/CI — tratamos como opcional.
  const tablet = sanitizeString(body.tablet, 128);
  const monitor = sanitizeString(body.monitor, 255);

  if (!hardwareUuid || !os || !cpu || !gpu || ramBytes === null) {
    throw new ValidationError({
      message: "Campos obrigatórios ausentes ou inválidos.",
      action:
        "Envie os campos hardware_uuid, os, cpu, gpu (strings) e ram_bytes (número inteiro).",
    });
  }

  const device = await userDevice.upsert({
    userId: userTryingToPost.id,
    hardwareUuid,
    os,
    cpu,
    ramBytes,
    gpu,
    pindoramaVersion,
    tablet,
    monitor,
  });

  await auditLog.record({
    action: "device.upserted",
    actorUserId: userTryingToPost.id,
    targetUserId: userTryingToPost.id,
    ip: controller.getClientIp(request),
  });

  return response.status(200).json(device);
}

function sanitizeString(value, maxLen) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  return trimmed.slice(0, maxLen);
}

function sanitizeBigint(value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }
  return Math.floor(value);
}
