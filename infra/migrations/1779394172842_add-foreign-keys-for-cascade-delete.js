exports.up = (pgm) => {
  pgm.addConstraint("sessions", "sessions_user_id_fkey", {
    foreignKeys: {
      columns: "user_id",
      references: "users(id)",
      onDelete: "CASCADE",
    },
  });

  pgm.addConstraint(
    "user_activation_tokens",
    "user_activation_tokens_user_id_fkey",
    {
      foreignKeys: {
        columns: "user_id",
        references: "users(id)",
        onDelete: "CASCADE",
      },
    },
  );
};

exports.down = false;
