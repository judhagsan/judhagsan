/*
 * Contas fixas para o ambiente local, recriadas a cada `npm run dev`.
 *
 * Roda como CommonJS puro (pg + bcryptjs), e não pelos models: `models/user.js`
 * é ESM e depende do alias `models/` do jsconfig, que só existe dentro do Next
 * e do Jest. Um `node infra/scripts/*.js` não resolve nenhum dos dois — mesma
 * razão pela qual `migrate.js` fala com o banco na mão.
 */
const dotenv = require("dotenv");
const { Client } = require("pg");
const bcryptjs = require("bcryptjs");

dotenv.config({ path: ".env.development" });

// Espelha o que `activation.activateUserByUserId()` concede a uma conta
// recém-ativada: é o usuário comum de verdade, não uma aproximação.
const USER_FEATURES = [
  "create:session",
  "read:session",
  "update:user",
  "delete:user",
  "manage:device",
];

// Administrador = usuário comum + as features privilegiadas de
// `models/authorization.js`. Fora `apoiador`, de propósito: apoio é estado de
// pagamento, não permissão, e concedê-lo aqui faria o admin cair na UI de
// apoiador sem nunca ter assinado.
const ADMIN_FEATURES = [
  ...USER_FEATURES,
  // Marcador do painel. Separado das permissões abaixo de propósito: `admin`
  // diz quem enxerga o painel, elas dizem o que ele pode fazer lá dentro.
  "admin",
  "read:user:all",
  "update:user:others",
  "delete:user:others",
  "read:status",
  "read:status:all",
  "create:migration",
  "read:migration",
  "manage:supporter",
];

// Apoiador concedido à mão: a feature entra sem `supporter_until`, que é
// justamente o caso que `supporter.expireOverdue()` ignora ("apoiador
// concedido à mão nunca expira sozinho"). Sem isso o cron diário revogaria a
// conta e o seed teria que devolvê-la a cada `npm run dev`.
const SUPPORTER_FEATURES = [...USER_FEATURES, "apoiador"];

// Cadastro que nunca foi ativado. É literalmente o que `user.create()` grava
// antes do clique no email — `activation.activateUserByUserId()` é quem troca
// isto pelas features de verdade.
const PENDING_FEATURES = ["read:activation_token"];

const ACCOUNTS = [
  {
    username: "admin",
    email: "admin@teste.com",
    password: "12345678",
    features: ADMIN_FEATURES,
    label: "administrador",
  },
  {
    username: "usuario",
    email: "user@teste.com",
    password: "12345678",
    features: USER_FEATURES,
    label: "usuário comum",
  },
  {
    username: "apoiador",
    email: "apoiador@teste.com",
    password: "12345678",
    features: SUPPORTER_FEATURES,
    label: "apoiador",
  },
  {
    username: "pendente",
    email: "pendente@teste.com",
    password: "12345678",
    features: PENDING_FEATURES,
    label: "cadastro não ativado",
  },
];

const LOCAL_HOSTS = [
  "localhost",
  "127.0.0.1",
  "::1",
  "host.docker.internal",
  "postgres",
  "db",
];

/*
 * Estas contas têm senha conhecida e publicada neste arquivo. Em qualquer lugar
 * que não seja a máquina do desenvolvedor elas são porta destrancada — e a de
 * admin, porta destrancada com permissão de mexer em outros usuários. Daí as
 * três checagens: a plataforma, o NODE_ENV e, principalmente, para qual banco
 * a conexão aponta. A última é a que importa, porque é a única que pega o caso
 * de rodar `npm run dev` na sua máquina com o .env apontando para um banco
 * remoto.
 */
function reasonToSkipSeeding() {
  if (process.env.VERCEL) {
    return "rodando na Vercel";
  }

  if (process.env.CI) {
    return "rodando em CI";
  }

  if (process.env.NODE_ENV === "production") {
    return "NODE_ENV=production";
  }

  const host = (process.env.POSTGRES_HOST || "").trim().toLowerCase();

  if (!host) {
    return "POSTGRES_HOST não definido";
  }

  if (!LOCAL_HOSTS.includes(host)) {
    return `POSTGRES_HOST=${host} não é um banco local`;
  }

  return null;
}

async function seedAccount(client, account) {
  // Custo 1 como em `models/password.js` fora de produção: o hash carrega o
  // próprio custo, então `compare()` funciona igual e o `npm run dev` não
  // paga meio segundo de bcrypt a cada subida.
  const hashedPassword = await bcryptjs.hash(account.password, 1);

  const results = await client.query({
    text: `
      INSERT INTO
        users (username, email, password, features, privacy_accepted_at)
      VALUES
        ($1, $2, $3, $4, timezone('utc', now()))
      ON CONFLICT (email) DO UPDATE
      SET
        username = EXCLUDED.username,
        password = EXCLUDED.password,
        features = EXCLUDED.features,
        updated_at = timezone('utc', now())
      RETURNING
        (xmax = 0) AS created
      ;`,
    values: [account.username, account.email, hashedPassword, account.features],
  });

  return results.rows[0].created;
}

async function main() {
  const skipReason = reasonToSkipSeeding();

  if (skipReason) {
    console.log(`⚪ Contas de teste não semeadas (${skipReason}).`);
    return;
  }

  const client = new Client({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    ssl: false,
  });

  try {
    await client.connect();

    for (const account of ACCOUNTS) {
      try {
        const created = await seedAccount(client, account);
        const verb = created ? "criada" : "atualizada";
        console.log(
          `🟢 Conta de teste ${verb}: ${account.email} (${account.label}, senha ${account.password})`,
        );
      } catch (error) {
        // Uma conta que falha não derruba a outra. O caso comum é já existir
        // alguém com o mesmo username e outro email — aí o ON CONFLICT (email)
        // não pega e a constraint de username estoura.
        console.error(
          `🔴 Não foi possível semear ${account.email}: ${error.message}`,
        );
      }
    }
  } finally {
    await client.end();
  }
}

/*
 * Nunca falha o `npm run dev`. Semear é conveniência: se o banco não subiu a
 * tempo ou o schema mudou, o certo é reclamar alto e deixar o servidor subir,
 * não bloquear o desenvolvedor por causa de duas contas de teste.
 */
if (require.main === module) {
  main()
    .catch((error) => {
      console.error("🔴 Falha ao semear contas de teste:", error.message);
    })
    .then(() => process.exit(0));
}

module.exports = {
  reasonToSkipSeeding,
  ACCOUNTS,
  ADMIN_FEATURES,
  USER_FEATURES,
  SUPPORTER_FEATURES,
  PENDING_FEATURES,
};
