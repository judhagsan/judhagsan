exports.up = (pgm) => {
  // O painel administrativo em /sessao precisava saber quem é admin, e até
  // aqui deduzia isso de `update:user:others` — a permissão mais privilegiada
  // que existia. Deduzir funcionava, mas amarra duas perguntas diferentes:
  // "vê o painel" e "pode editar outro usuário". Quem ganhasse a segunda por
  // um motivo pontual herdava a primeira sem ninguém ter decidido isso.
  //
  // `admin` passa a ser dado explícito em `users.features`, como as demais.
  // Não concede nada sozinha: cada endpoint continua exigindo a sua feature
  // granular. É só o marcador de quem enxerga o painel.
  //
  // O backfill mantém o comportamento de antes para quem já existe — ninguém
  // perde o painel ao subir esta migration. `array_append` com a guarda do
  // NOT ... = ANY deixa a migration idempotente, que importa porque o banco de
  // preview pode estar em qualquer ponto do histórico.
  pgm.sql(`
    UPDATE
      users
    SET
      features = array_append(features, 'admin'),
      updated_at = timezone('utc', now())
    WHERE
      'update:user:others' = ANY(features)
      AND NOT ('admin' = ANY(features))
  `);
};

exports.down = false;
