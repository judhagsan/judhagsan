exports.up = (pgm) => {
  pgm.addColumns(
    "users",
    {
      // Quando avisamos esta pessoa, por e-mail, que a cobrança do apoio foi
      // recusada.
      //
      // Existe para não virar spam: o Mercado Pago retenta a cobrança por até
      // 10 dias e cada tentativa gera uma notificação nova. Sem uma marca de
      // "já avisei", quem teve o cartão recusado receberia um e-mail por
      // tentativa. Volta a NULL quando alguma cobrança é aprovada, para que a
      // próxima recusa possa avisar de novo.
      supporter_declined_notified_at: {
        type: "timestamptz",
        notNull: false,
      },
    },
    { ifNotExists: true },
  );
};

exports.down = false;
