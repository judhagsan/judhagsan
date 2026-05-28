/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  // Adiciona `tablet` e `monitor` (perifericos opcionais coletados via
  // telemetria do app) e `hardware_uuid` (UUID estável do Mac/PC lido via
  // `ioreg`/`dmidecode`/`WMI` no app). O fingerprint do dispositivo passa
  // de (user_id, os, cpu, gpu, ram_bytes) — instável quando o usuário
  // atualiza o SO ou troca de RAM — para (user_id, hardware_uuid), que
  // só muda quando a placa-mãe é trocada.
  //
  // A tabela é dropada e recriada do zero porque ainda estamos em dev e o
  // schema novo é incompatível com os registros antigos (não há como
  // backfillar `hardware_uuid` sem o app reenviar).
  pgm.dropTable("user_devices", { ifExists: true });

  pgm.createTable("user_devices", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    user_id: {
      type: "uuid",
      notNull: true,
      references: "users(id)",
      onDelete: "CASCADE",
    },

    // Identidade estável da máquina. No macOS vem do
    // `IOPlatformUUID` (`ioreg -d2 -c IOPlatformExpertDevice`); no Windows
    // do `WMI Win32_ComputerSystemProduct.UUID`; no Linux do
    // `/sys/class/dmi/id/product_uuid`. UUID padrão tem 36 caracteres,
    // 64 sobra pra qualquer formato alternativo.
    hardware_uuid: {
      type: "varchar(64)",
      notNull: true,
    },

    os: {
      type: "varchar(64)",
      notNull: false,
    },

    cpu: {
      type: "varchar(128)",
      notNull: false,
    },

    ram_bytes: {
      type: "bigint",
      notNull: false,
    },

    gpu: {
      type: "varchar(128)",
      notNull: false,
    },

    tablet: {
      type: "varchar(128)",
      notNull: false,
    },

    monitor: {
      type: "varchar(255)",
      notNull: false,
    },

    pindorama_version: {
      type: "varchar(32)",
      notNull: false,
    },

    upload_paused: {
      type: "boolean",
      notNull: true,
      default: false,
    },

    first_seen_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },

    last_seen_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
  });

  pgm.createIndex("user_devices", "user_id");

  // Fingerprint estável: o mesmo Mac do mesmo usuário sempre cai na mesma
  // linha, independente de o SO atualizar, de a RAM mudar, ou de uma eGPU
  // entrar/sair. Só vira "dispositivo novo" quando a placa-mãe troca (ou
  // num Hackintosh quando o usuário regenera o IOPlatformUUID).
  pgm.createIndex("user_devices", ["user_id", "hardware_uuid"], {
    unique: true,
    name: "user_devices_user_hardware_idx",
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = false;
