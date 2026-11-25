exports.up = (pgm) => {
  // Campanhas de aviso de release do Pindorama criadas pelo painel admin.
  // `tested_content_hash` registra o SHA-256 exato de (tag, subject, body)
  // enviado no teste: se o texto for editado depois, o hash deixa de bater e o
  // envio para todos volta a ficar bloqueado até um novo teste.
  pgm.createTable("release_announcements", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    tag: {
      type: "varchar(32)",
      notNull: false,
    },

    subject: {
      type: "varchar(160)",
      notNull: true,
    },

    body: {
      type: "text",
      notNull: true,
    },

    status: {
      type: "varchar(20)",
      notNull: true,
      default: "draft",
    },

    tested_at: {
      type: "timestamptz",
      notNull: false,
    },

    tested_by_user_id: {
      type: "uuid",
      notNull: false,
      references: "users(id)",
      onDelete: "SET NULL",
    },

    tested_content_hash: {
      type: "varchar(64)",
      notNull: false,
    },

    started_at: {
      type: "timestamptz",
      notNull: false,
    },

    completed_at: {
      type: "timestamptz",
      notNull: false,
    },

    created_by_user_id: {
      type: "uuid",
      notNull: false,
      references: "users(id)",
      onDelete: "SET NULL",
    },

    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },

    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
  });

  pgm.createIndex("release_announcements", "status");
  pgm.createIndex("release_announcements", "created_at");

  // Entregas individuais de cada campanha. A restrição única em
  // (announcement_id, user_id) garante idempotência mesmo quando o disparo
  // ocorre em vários lotes ou precisa ser retomado após falha transitória.
  pgm.createTable("release_announcement_deliveries", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    announcement_id: {
      type: "uuid",
      notNull: true,
      references: "release_announcements(id)",
      onDelete: "CASCADE",
    },

    user_id: {
      type: "uuid",
      notNull: true,
      references: "users(id)",
      onDelete: "CASCADE",
    },

    email_snapshot: {
      type: "varchar(254)",
      notNull: true,
    },

    status: {
      type: "varchar(20)",
      notNull: true,
      default: "pending",
    },

    error_message: {
      type: "text",
      notNull: false,
    },

    sent_at: {
      type: "timestamptz",
      notNull: false,
    },

    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
  });

  pgm.addConstraint(
    "release_announcement_deliveries",
    "release_announcement_deliveries_announcement_user_unique",
    {
      unique: ["announcement_id", "user_id"],
    },
  );

  pgm.createIndex("release_announcement_deliveries", [
    "announcement_id",
    "status",
  ]);
};

exports.down = false;
