exports.up = (pgm) => {
  // A integração de pagamento (AbacatePay) foi removida: a loja não tinha
  // cartão habilitado e a assinatura recorrente do provedor só existe por
  // cartão. A feature de apoiador continua, concedida manualmente.
  pgm.dropTable("abacatepay_webhook_events");
  pgm.dropTable("supporter_payments");
  pgm.dropColumn("users", "abacatepay_customer_id");
};

exports.down = false;
