exports.up = (pgm) => {
  // Arquivos imutáveis, acessíveis sem sessão para leitores e proxies de email.
  // Permanecem disponíveis quando um rascunho ou o autor é removido.
  pgm.createTable("email_media", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    content: { type: "bytea", notNull: true },
    content_type: { type: "varchar(32)", notNull: true },
    byte_size: { type: "integer", notNull: true },
    width: { type: "integer", notNull: true },
    height: { type: "integer", notNull: true },
    sha256: { type: "varchar(64)", notNull: true, unique: true },
    created_by_user_id: {
      type: "uuid",
      references: "users(id)",
      onDelete: "SET NULL",
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
  });
  pgm.addConstraint("email_media", "email_media_size_check", {
    check:
      "byte_size > 0 AND byte_size <= 3000000 AND octet_length(content) = byte_size",
  });
  pgm.addConstraint("email_media", "email_media_type_check", {
    check:
      "content_type IN ('image/png', 'image/jpeg', 'image/gif', 'image/webp')",
  });
};
exports.down = false;
