exports.up = (pgm) => {
  // Log dos webhooks do Mercado Pago. Existe por dois motivos: idempotência,
  // já que a mesma notificação chega mais de uma vez, e poder reprocessar à
  // mão o que falhou — um evento só é marcado como processado depois que o
  // benefício foi de fato aplicado.
  pgm.createTable("mercadopago_webhook_events", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    // "subscription_preapproval", "subscription_authorized_payment",
    // "payment"...
    topic: {
      type: "varchar(64)",
      notNull: true,
    },

    action: {
      type: "varchar(64)",
      notNull: false,
    },

    // `data.id` da notificação: a assinatura ou o pagamento que mudou.
    resource_id: {
      type: "varchar(64)",
      notNull: false,
    },

    payload: {
      type: "jsonb",
      notNull: true,
    },

    received_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },

    processed_at: {
      type: "timestamptz",
      notNull: false,
    },

    error: {
      type: "text",
      notNull: false,
    },
  });

  pgm.createIndex("mercadopago_webhook_events", ["topic", "resource_id"]);
  pgm.createIndex("mercadopago_webhook_events", "processed_at", {
    where: "processed_at IS NULL",
  });

  pgm.addColumns("users", {
    // Assinatura no Mercado Pago (o `preapproval`). Guardado para consultar
    // estado e cancelar; o vínculo no sentido inverso vem do
    // `external_reference`, que carrega o id deste usuário.
    mercadopago_preapproval_id: {
      type: "varchar(64)",
      notNull: false,
      unique: true,
    },

    // authorized, paused, cancelled, pending.
    mercadopago_status: {
      type: "varchar(32)",
      notNull: false,
    },

    // Até quando a feature `apoiador` vale. Cada cobrança confirmada empurra
    // a data; o cron diário revoga quem passou do prazo. É carência: o Mercado
    // Pago retenta uma cobrança rejeitada por até 10 dias, e ninguém pode
    // perder o acesso enquanto essa régua ainda está rodando.
    supporter_until: {
      type: "timestamptz",
      notNull: false,
    },
  });
};

exports.down = false;
