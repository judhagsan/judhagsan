exports.up = (pgm) => {
  // Vínculo do usuário com o cliente correspondente no AbacatePay (reusado
  // entre PIX e assinatura para mapear webhooks de volta ao usuário).
  pgm.addColumn("users", {
    abacatepay_customer_id: {
      type: "varchar(64)",
      notNull: false,
    },
  });

  // Cada tentativa de apoio (PIX avulso ou assinatura). O `provider_id` é o
  // id da cobrança/assinatura no AbacatePay e é único — usado para dedupe e
  // para casar o webhook com o usuário.
  pgm.createTable("supporter_payments", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    user_id: {
      type: "uuid",
      notNull: true,
      references: "users(id)",
      onDelete: "CASCADE",
    },

    // 'pix' | 'card'
    method: {
      type: "varchar(10)",
      notNull: true,
    },

    // 'one_time' | 'subscription'
    kind: {
      type: "varchar(20)",
      notNull: true,
    },

    provider: {
      type: "varchar(20)",
      notNull: true,
      default: "abacatepay",
    },

    provider_id: {
      type: "varchar(64)",
      notNull: true,
      unique: true,
    },

    amount_cents: {
      type: "integer",
      notNull: false,
    },

    status: {
      type: "varchar(20)",
      notNull: true,
      default: "PENDING",
    },

    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },

    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
  });

  pgm.createIndex("supporter_payments", "user_id");

  // Idempotência de webhook: cada evento entregue tem um id único (`log_...`).
  // Se já estiver aqui, o evento é ignorado numa reentrega.
  pgm.createTable("abacatepay_webhook_events", {
    event_id: {
      type: "varchar(64)",
      primaryKey: true,
    },

    event: {
      type: "varchar(60)",
      notNull: true,
    },

    received_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
  });
};

exports.down = false;
