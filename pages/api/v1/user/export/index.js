import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user.js";
import session from "models/session.js";
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

  const exportData = {
    _meta: {
      exported_at: new Date().toISOString(),
      format_version: "1.0",
      description:
        "Exportação completa dos dados pessoais conforme Art. 18 V da LGPD.",
    },
    user: {
      username: userFound.username,
      email: userFound.email,
      privacy_accepted_at: userFound.privacy_accepted_at,
      created_at: userFound.created_at,
    },
    sessions: sessionsResult.rows,
    activation_tokens: activationTokensResult.rows,
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

  return response.status(200).json(exportData);
}
