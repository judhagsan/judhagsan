exports.up = (pgm) => {
  pgm.createTable("rate_limits", {
    identifier: {
      type: "varchar(255)",
      primaryKey: true,
    },

    count: {
      type: "integer",
      notNull: true,
      default: 1,
    },

    window_started_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
  });

  // Index para limpeza periódica de registros antigos
  pgm.createIndex("rate_limits", "window_started_at");
};

exports.down = false;
