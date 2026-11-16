exports.up = (pgm) => {
  // Buscas por username e email no login, cadastro e atualização fazem
  // comparação case-insensitive com LOWER(). Os índices UNIQUE padrão são
  // case-sensitive, então sem índices funcionais cada lookup varre a tabela.
  pgm.sql(
    "CREATE INDEX IF NOT EXISTS users_lower_username_idx ON users (LOWER(username));",
  );
  pgm.sql(
    "CREATE INDEX IF NOT EXISTS users_lower_email_idx ON users (LOWER(email));",
  );

  // Acelera o cron diário de expiração de apoiadores sem indexar linhas nulas.
  pgm.createIndex("users", "supporter_until", {
    name: "users_supporter_until_idx",
    where: "supporter_until IS NOT NULL",
    ifNotExists: true,
  });

  // Acelera `expireAllByUserId`, exportação de dados e limpeza periódica.
  pgm.createIndex("sessions", "user_id", {
    name: "sessions_user_id_idx",
    ifNotExists: true,
  });
  pgm.createIndex("sessions", "expires_at", {
    name: "sessions_expires_at_idx",
    ifNotExists: true,
  });

  pgm.createIndex("user_activation_tokens", "user_id", {
    name: "user_activation_tokens_user_id_idx",
    ifNotExists: true,
  });
  pgm.createIndex("user_activation_tokens", "expires_at", {
    name: "user_activation_tokens_expires_at_idx",
    ifNotExists: true,
  });
};

exports.down = false;
