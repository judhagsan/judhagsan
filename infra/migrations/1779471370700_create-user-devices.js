exports.up = (pgm) => {
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

  // Dedupe natural por usuário + fingerprint do hardware. Permite upsert
  // estável: mesma máquina logando de novo atualiza last_seen_at em vez
  // de criar nova linha.
  pgm.createIndex(
    "user_devices",
    ["user_id", "os", "cpu", "gpu", "ram_bytes"],
    {
      unique: true,
      name: "user_devices_user_fingerprint_idx",
    },
  );
};

exports.down = false;
