import { createRouter } from "next-connect";
import database from "infra/database";
import controller from "infra/controller.js";
import authorization from "models/authorization.js";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .get(getHandler)
  .handler(controller.errorHandlers);

async function getHandler(request, response) {
  const userTryingToGet = request.context.user;
  const updatedAt = new Date().toISOString();
  const databaseName = process.env.POSTGRES_DB;

  const result = await database.query({
    text: `
      SELECT
        current_setting('server_version') AS server_version,
        current_setting('max_connections')::int AS max_connections,
        (
          SELECT count(*)::int
          FROM pg_stat_activity
          WHERE datname = $1
        ) AS opened_connections
      ;`,
    values: [databaseName],
  });

  const row = result.rows[0];

  const statusObject = {
    updated_at: updatedAt,
    dependencies: {
      database: {
        version: row.server_version,
        max_connections: row.max_connections,
        opened_connections: row.opened_connections,
      },
    },
  };

  const secureOutputValues = authorization.filterOutput(
    userTryingToGet,
    "read:status",
    statusObject,
  );

  return response.status(200).json(secureOutputValues);
}
