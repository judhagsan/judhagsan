exports.up = (pgm) => {
  pgm.addColumn("users", {
    privacy_accepted_at: {
      type: "timestamptz",
      notNull: false,
    },
  });
};

exports.down = false;
