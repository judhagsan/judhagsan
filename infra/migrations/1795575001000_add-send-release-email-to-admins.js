exports.up = (pgm) => {
  // Feature granular para redigir, testar e disparar avisos de novos releases
  // do Pindorama pelo painel administrativo. Separada de `admin` e das outras
  // ações do painel pela mesma regra: quem enxerga o painel recebe cada poder
  // explicitamente, podendo tê-lo revogado sem mexer no restante.
  pgm.sql(`
    UPDATE
      users
    SET
      features = array_append(features, 'send:release_email'),
      updated_at = timezone('utc', now())
    WHERE
      'admin' = ANY(features)
      AND NOT ('send:release_email' = ANY(features))
  `);
};

exports.down = false;
