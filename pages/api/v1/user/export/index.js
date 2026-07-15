import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user.js";
import session from "models/session.js";
import auditLog from "models/auditLog.js";
import database from "infra/database.js";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .get(controller.canRequest("read:session"), getHandler)
  .handler(controller.errorHandlers);

async function getHandler(request, response) {
  const sessionToken = request.cookies.session_id;
  const sessionObject = await session.findOneValidByToken(sessionToken);
  const userFound = await user.findOneById(sessionObject.user_id);

  const sessionsResult = await database.query({
    text: `
      SELECT
        created_at,
        expires_at
      FROM
        sessions
      WHERE
        user_id = $1
      ORDER BY
        created_at DESC
    ;`,
    values: [userFound.id],
  });

  const activationTokensResult = await database.query({
    text: `
      SELECT
        used_at,
        expires_at,
        created_at
      FROM
        user_activation_tokens
      WHERE
        user_id = $1
      ORDER BY
        created_at DESC
    ;`,
    values: [userFound.id],
  });

  const devicesResult = await database.query({
    text: `
      SELECT
        hardware_uuid, os, cpu, ram_bytes, gpu, pindorama_version,
        tablet, monitor,
        upload_paused, first_seen_at, last_seen_at
      FROM
        user_devices
      WHERE
        user_id = $1
      ORDER BY
        last_seen_at DESC
    ;`,
    values: [userFound.id],
  });

  const exportData = {
    _meta: {
      exported_at: new Date().toISOString(),
      format_version: "1.0",
      description: "Exportação completa dos dados pessoais do usuário.",
    },
    user: {
      username: userFound.username,
      email: userFound.email,
      privacy_accepted_at: userFound.privacy_accepted_at,
      supporter_wall_opt_in: userFound.supporter_wall_opt_in,
      discord_user_id: userFound.discord_user_id,
      created_at: userFound.created_at,
    },
    sessions: sessionsResult.rows,
    activation_tokens: activationTokensResult.rows,
    devices: devicesResult.rows,
  };

  const today = new Date().toISOString().split("T")[0];
  const filename = `judhagsan-export-${userFound.username}-${today}.json`;

  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}"`,
  );
  response.setHeader(
    "Cache-Control",
    "no-store, no-cache, max-age=0, must-revalidate",
  );

  await auditLog.record({
    action: "user.exported",
    actorUserId: userFound.id,
    targetUserId: userFound.id,
    ip: controller.getClientIp(request),
  });

  return response.status(200).json(exportData);
}
