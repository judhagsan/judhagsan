import database from "infra/database.js";
import { NotFoundError, ForbiddenError } from "infra/errors.js";

async function findAllByUserId(userId) {
  const results = await database.query({
    text: `
      SELECT
        id, os, cpu, ram_bytes, gpu, pindorama_version,
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

async function upsert({ userId, os, cpu, ramBytes, gpu, pindoramaVersion }) {
  // Se existir uma linha com upload_paused=true para o mesmo fingerprint,
  // apenas tocamos last_seen_at (não atualizamos os campos técnicos).
  // Caso contrário, inserimos ou atualizamos normalmente.
  const results = await database.query({
    text: `
      INSERT INTO user_devices
        (user_id, os, cpu, ram_bytes, gpu, pindorama_version)
      VALUES
        ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id, os, cpu, gpu, ram_bytes) DO UPDATE
      SET
        pindorama_version = CASE
          WHEN user_devices.upload_paused
          THEN user_devices.pindorama_version
          ELSE EXCLUDED.pindorama_version
        END,
        last_seen_at = NOW()
      RETURNING *
    ;`,
    values: [userId, os, cpu, ramBytes, gpu, pindoramaVersion],
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

const userDevice = {
  findAllByUserId,
  findOneById,
  upsert,
  setPaused,
  remove,
};

export default userDevice;
