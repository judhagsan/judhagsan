const { Client } = require("pg");
const { resolve } = require("node:path");
const migrationRunner = require("node-pg-migrate").default;

function getSSLValues() {
  if (process.env.POSTGRES_CA) {
    return { ca: process.env.POSTGRES_CA };
  }
  return process.env.NODE_ENV === "production" ? true : false;
}

async function main() {
  const client = new Client({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    ssl: getSSLValues(),
  });

  try {
    await client.connect();

    const migrated = await migrationRunner({
      dbClient: client,
      dir: resolve("infra", "migrations"),
      direction: "up",
      migrationsTable: "pgmigrations",
      dryRun: false,
    });

    if (migrated.length === 0) {
      console.log("🟢 Nenhuma migração pendente.");
    } else {
      console.log(`🟢 ${migrated.length} migração(ões) executada(s):`);
      migrated.forEach((m) => console.log(`  - ${m.name}`));
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("🔴 Falha ao executar migrações:", error);
  process.exit(1);
});
