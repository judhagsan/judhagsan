exports.up = (pgm) => {
  // Preferência de avisos de novos releases do Pindorama e token exclusivo de
  // descadastro em 1 clique (usado nos links do rodapé e no cabeçalho
  // List-Unsubscribe, sem exigir login e sem expor o id interno do usuário).
  pgm.addColumns("users", {
    release_emails_enabled: {
      type: "boolean",
      notNull: true,
      default: true,
    },
    email_unsubscribe_token: {
      type: "uuid",
      notNull: true,
      default: pgm.func("gen_random_uuid()"),
      unique: true,
    },
  });
};

exports.down = false;
