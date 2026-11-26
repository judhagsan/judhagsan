exports.up = (pgm) => {
  // Mantém o comportamento dos avisos existentes; novos rascunhos da UI
  // podem escolher novidades gerais. O tipo faz parte do conteúdo testado.
  pgm.addColumn("release_announcements", {
    kind: { type: "varchar(20)", notNull: true, default: "pindorama" },
  });
  pgm.addConstraint(
    "release_announcements",
    "release_announcements_kind_check",
    {
      check: "kind IN ('general', 'pindorama')",
    },
  );
};

exports.down = false;
