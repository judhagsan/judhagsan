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
  "read:device:all",
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
        id,
        (xmax = 0) AS created
      ;`,
    values: [account.username, account.email, hashedPassword, account.features],
  });

  return results.rows[0];
}

/*
 * Hardware de mentira, mas plausível, para o card de dispositivos do painel
 * ter distribuição de verdade no ambiente local. Com a base vazia ele mostra
 * "nenhum dispositivo" e não há como ver se as barras, a moda e o seletor de
 * dimensão funcionam.
 *
 * `hardware_uuid` é fixo por linha de propósito: o índice único é
 * (user_id, hardware_uuid), então rodar o seed de novo atualiza a mesma
 * máquina em vez de inventar uma nova a cada `npm run dev`.
 *
 * A conta pendente fica de fora: quem nunca ativou o cadastro nunca entrou no
 * app para mandar telemetria.
 */
const GB = 1024 * 1024 * 1024;

const DEVICES = {
  "admin@teste.com": [
    {
      hardware_uuid: "seed-admin-desktop",
      os: "Windows 11",
      cpu: "AMD Ryzen 7 5800X",
      ram_bytes: 32 * GB,
      gpu: "NVIDIA GeForce RTX 4070",
      tablet: "Wacom Intuos Pro M",
      monitor: "Dell U2723QE",
    },
    {
      hardware_uuid: "seed-admin-linux",
      os: "Linux",
      cpu: "AMD Ryzen 5 5600",
      ram_bytes: 16 * GB,
      gpu: "NVIDIA GeForce RTX 3060",
      tablet: "Wacom Intuos Pro M",
      monitor: "LG 27UP850",
    },
  ],
  "user@teste.com": [
    {
      hardware_uuid: "seed-user-desktop",
      os: "Windows 11",
      cpu: "Intel Core i5-12400F",
      ram_bytes: 16 * GB,
      gpu: "NVIDIA GeForce RTX 3060",
      tablet: "Wacom Intuos Pro M",
      monitor: "Dell U2723QE",
    },
  ],
  "apoiador@teste.com": [
    {
      hardware_uuid: "seed-apoiador-mac",
      os: "macOS 15",
      cpu: "Apple M2 Pro",
      ram_bytes: 16 * GB,
      gpu: "Apple M2 Pro",
      tablet: "iPad Pro 11",
      monitor: "Apple Studio Display",
    },
    {
      hardware_uuid: "seed-apoiador-note",
      os: "Windows 11",
      cpu: "Intel Core i7-11800H",
      ram_bytes: 16 * GB,
      gpu: "NVIDIA GeForce GTX 1660 Ti",
      tablet: "Wacom One",
      monitor: "LG 27UP850",
    },
  ],
};

async function seedDevices(client, userId, devices) {
  for (const device of devices) {
    await client.query({
      text: `
        INSERT INTO
          user_devices
          (user_id, hardware_uuid, os, cpu, ram_bytes, gpu, tablet, monitor,
           pindorama_version)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (user_id, hardware_uuid) DO UPDATE
        SET
          os = EXCLUDED.os,
          cpu = EXCLUDED.cpu,
          ram_bytes = EXCLUDED.ram_bytes,
          gpu = EXCLUDED.gpu,
          tablet = EXCLUDED.tablet,
          monitor = EXCLUDED.monitor,
          last_seen_at = timezone('utc', now())
        ;`,
      values: [
        userId,
        device.hardware_uuid,
        device.os,
        device.cpu,
        device.ram_bytes,
        device.gpu,
        device.tablet,
        device.monitor,
        "0.1.0",
      ],
    });
  }

  return devices.length;
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
        const seeded = await seedAccount(client, account);
        const verb = seeded.created ? "criada" : "atualizada";

        const devices = DEVICES[account.email] || [];
        const deviceCount = await seedDevices(client, seeded.id, devices);
        const deviceNote = deviceCount ? `, ${deviceCount} dispositivo(s)` : "";

        console.log(
          `🟢 Conta de teste ${verb}: ${account.email} (${account.label}, senha ${account.password}${deviceNote})`,
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
  DEVICES,
  ADMIN_FEATURES,
  USER_FEATURES,
  SUPPORTER_FEATURES,
  PENDING_FEATURES,
};
