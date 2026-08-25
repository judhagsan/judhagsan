import database from "infra/database.js";
import { NotFoundError, ForbiddenError } from "infra/errors.js";

async function findAllByUserId(userId) {
  const results = await database.query({
    text: `
      SELECT
        id, hardware_uuid, os, cpu, ram_bytes, gpu, pindorama_version,
        tablet, monitor,
        upload_paused, first_seen_at, last_seen_at
      FROM
        user_devices
      WHERE
        user_id = $1
      ORDER BY
        last_seen_at DESC
    ;`,
    values: [userId],
  });
  return results.rows;
}

async function findOneById(deviceId) {
  const results = await database.query({
    text: `SELECT * FROM user_devices WHERE id = $1 LIMIT 1`,
    values: [deviceId],
  });
  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: "Dispositivo não encontrado.",
      action: "Verifique se o id está correto.",
    });
  }
  return results.rows[0];
}

async function upsert({
  userId,
  hardwareUuid,
  os,
  cpu,
  ramBytes,
  gpu,
  pindoramaVersion,
  tablet,
  monitor,
}) {
  // Fingerprint estável agora é (user_id, hardware_uuid) — o mesmo Mac
  // sempre cai na mesma linha, independente de upgrade de SO/RAM/GPU. Os
  // demais campos passam a ser apenas dados do estado atual: quando
  // upload_paused está true, mantemos os valores antigos (o usuário pediu
  // pra parar de subir telemetria); caso contrário, atualizamos com o que
  // chegou no body.
  const results = await database.query({
    text: `
      INSERT INTO user_devices
        (user_id, hardware_uuid, os, cpu, ram_bytes, gpu, pindorama_version, tablet, monitor)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (user_id, hardware_uuid) DO UPDATE
      SET
        os = CASE
          WHEN user_devices.upload_paused
          THEN user_devices.os
          ELSE EXCLUDED.os
        END,
        cpu = CASE
          WHEN user_devices.upload_paused
          THEN user_devices.cpu
          ELSE EXCLUDED.cpu
        END,
        ram_bytes = CASE
          WHEN user_devices.upload_paused
          THEN user_devices.ram_bytes
          ELSE EXCLUDED.ram_bytes
        END,
        gpu = CASE
          WHEN user_devices.upload_paused
          THEN user_devices.gpu
          ELSE EXCLUDED.gpu
        END,
        pindorama_version = CASE
          WHEN user_devices.upload_paused
          THEN user_devices.pindorama_version
          ELSE EXCLUDED.pindorama_version
        END,
        tablet = CASE
          WHEN user_devices.upload_paused
          THEN user_devices.tablet
          ELSE EXCLUDED.tablet
        END,
        monitor = CASE
          WHEN user_devices.upload_paused
          THEN user_devices.monitor
          ELSE EXCLUDED.monitor
        END,
        last_seen_at = NOW()
      RETURNING *
    ;`,
    values: [
      userId,
      hardwareUuid,
      os,
      cpu,
      ramBytes,
      gpu,
      pindoramaVersion,
      tablet,
      monitor,
    ],
  });
  return results.rows[0];
}

async function setPaused(deviceId, ownerUserId, paused) {
  const device = await findOneById(deviceId);
  if (device.user_id !== ownerUserId) {
    throw new ForbiddenError({
      message: "Você não possui permissão para alterar este dispositivo.",
      action: "Verifique se o dispositivo pertence à sua conta.",
    });
  }
  const results = await database.query({
    text: `
      UPDATE user_devices
      SET upload_paused = $2
      WHERE id = $1
      RETURNING *
    ;`,
    values: [deviceId, paused],
  });
  return results.rows[0];
}

async function remove(deviceId, ownerUserId) {
  const device = await findOneById(deviceId);
  if (device.user_id !== ownerUserId) {
    throw new ForbiddenError({
      message: "Você não possui permissão para excluir este dispositivo.",
      action: "Verifique se o dispositivo pertence à sua conta.",
    });
  }
  await database.query({
    text: `DELETE FROM user_devices WHERE id = $1`,
    values: [deviceId],
  });
  return device;
}

/*
 * Telemetria agregada do parque inteiro, para o painel.
 *
 * Uma query só, com UNION ALL por dimensão, em vez de seis idas ao banco. Cada
 * linha vem etiquetada com a dimensão a que pertence, e quem chama separa —
 * agrupar aqui evita seis round-trips para montar um card.
 *
 * `ram_bytes` vira faixa de GB arredondada: 16.0 e 15.9 GB são a mesma
 * configuração para quem lê, e contá-las separado espalharia a moda em duas
 * linhas quase iguais.
 */
const STATS_DIMENSIONS = ["os", "cpu", "gpu", "ram", "tablet", "monitor"];

async function stats({ limit } = {}) {
  const safeLimit = Number.isInteger(Number.parseInt(limit, 10))
    ? Math.min(Math.max(Number.parseInt(limit, 10), 1), 20)
    : 5;

  const results = await database.query({
    text: `
      SELECT 'os' AS dimension, os AS value, count(*)::int AS count
        FROM user_devices WHERE os IS NOT NULL AND os <> '' GROUP BY os
      UNION ALL
      SELECT 'cpu', cpu, count(*)::int
        FROM user_devices WHERE cpu IS NOT NULL AND cpu <> '' GROUP BY cpu
      UNION ALL
      SELECT 'gpu', gpu, count(*)::int
        FROM user_devices WHERE gpu IS NOT NULL AND gpu <> '' GROUP BY gpu
      UNION ALL
      SELECT 'ram',
             round(ram_bytes / 1073741824.0)::text || ' GB',
             count(*)::int
        FROM user_devices WHERE ram_bytes IS NOT NULL AND ram_bytes > 0
        GROUP BY round(ram_bytes / 1073741824.0)
      UNION ALL
      SELECT 'tablet', tablet, count(*)::int
        FROM user_devices WHERE tablet IS NOT NULL AND tablet <> '' GROUP BY tablet
      UNION ALL
      SELECT 'monitor', monitor, count(*)::int
        FROM user_devices WHERE monitor IS NOT NULL AND monitor <> '' GROUP BY monitor
      ORDER BY count DESC, value ASC
      ;`,
  });

  const totalResult = await database.query({
    text: `SELECT count(*)::int AS total FROM user_devices`,
  });
  const total = totalResult.rows[0].total;

  const dimensions = {};
  for (const dimension of STATS_DIMENSIONS) {
    dimensions[dimension] = results.rows
      .filter((row) => row.dimension === dimension)
      .slice(0, safeLimit)
      .map((row) => ({ value: row.value, count: row.count }));
  }

  return { total, limit: safeLimit, dimensions };
}

const userDevice = {
  stats,
  findAllByUserId,
  findOneById,
  upsert,
  setPaused,
  remove,
};

export default userDevice;
