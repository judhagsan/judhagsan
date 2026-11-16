import { Client, Pool } from "pg";
import { ServiceError } from "./errors.js";

const GLOBAL_POOL_KEY = Symbol.for("judhagsan.pgPool");

function getPool() {
  if (!globalThis[GLOBAL_POOL_KEY]) {
    const pool = new Pool({
      host: process.env.POSTGRES_HOST,
      port: process.env.POSTGRES_PORT,
      user: process.env.POSTGRES_USER,
      database: process.env.POSTGRES_DB,
      password: process.env.POSTGRES_PASSWORD,
      ssl: getSSLValues(),
      // Em desenvolvimento/teste local mantemos no máximo 1 conexão no pool
      // para reaproveitar o handshake sem inflar `pg_stat_activity`
      // (verificação em `/api/v1/status`). Em produção permitimos concorrência
      // controlada com idle curto para ambiente serverless.
      max: process.env.NODE_ENV === "production" ? 5 : 1,
      idleTimeoutMillis: process.env.NODE_ENV === "production" ? 10000 : 5000,
      connectionTimeoutMillis: 5000,
    });

    pool.on("error", (error) => {
      console.error({
        name: "DatabasePoolError",
        underlyingErrorName: error?.name,
        message: error?.message,
      });
    });

    globalThis[GLOBAL_POOL_KEY] = pool;
  }

  return globalThis[GLOBAL_POOL_KEY];
}

async function query(queryObject) {
  // Dentro de workers do Jest (ex.: `tests/orchestrator.js`), cada consulta
  // fecha imediatamente para não deixar conexão ociosa somada às do servidor.
  if (process.env.JEST_WORKER_ID) {
    let client;
    try {
      client = await getNewClient();
      return await client.query(queryObject);
    } catch (error) {
      throw new ServiceError({
        message: "Erro na conexão com Banco ou na Query.",
        cause: error,
      });
    } finally {
      await client?.end();
    }
  }

  try {
    return await getPool().query(queryObject);
  } catch (error) {
    throw new ServiceError({
      message: "Erro na conexão com Banco ou na Query.",
      cause: error,
    });
  }
}

async function getNewClient() {
  const client = new Client({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    ssl: getSSLValues(),
  });

  await client.connect();
  return client;
}

const database = {
  query,
  getNewClient,
};

export default database;

function getSSLValues() {
  if (process.env.POSTGRES_CA) {
    return {
      ca: process.env.POSTGRES_CA,
    };
  }

  return process.env.NODE_ENV === "production" ? true : false;
}
