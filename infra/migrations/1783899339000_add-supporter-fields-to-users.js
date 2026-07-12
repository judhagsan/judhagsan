exports.up = (pgm) => {
  pgm.addColumns("users", {
    // Opt-in para exibir o username no mural público de apoiadores.
    supporter_wall_opt_in: {
      type: "boolean",
      notNull: true,
      default: false,
    },

    // Snowflake do usuário no Discord, preenchido ao conectar via OAuth2.
    discord_user_id: {
      type: "varchar(32)",
      notNull: false,
      unique: true,
    },
  });
};

exports.down = false;
