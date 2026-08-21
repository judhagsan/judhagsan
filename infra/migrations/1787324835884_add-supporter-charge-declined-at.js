exports.up = (pgm) => {
  pgm.addColumns(
    "users",
    {
      // Quando a última cobrança desta pessoa foi recusada. Volta a NULL
      // quando alguma cobrança é aprovada.
      //
      // Separada de `supporter_declined_notified_at` porque as duas respondem
      // perguntas diferentes: esta é "a cobrança falhou?", que a tela precisa
      // saber; a outra é "já avisamos por e-mail?", que só existe para não
      // mandar um e-mail por tentativa durante os 10 dias de retentativa.
      //
      // Enquanto era uma coluna só, um envio de e-mail que falhasse desfazia
      // a marca — e a tela voltava a dizer que a cobrança estava a caminho.
      supporter_charge_declined_at: {
        type: "timestamptz",
        notNull: false,
      },
    },
    { ifNotExists: true },
  );
};

exports.down = false;
