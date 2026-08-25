exports.up = (pgm) => {
  // O card de usuários cadastrados é a primeira tela do painel que lê a base
  // inteira, e listar todo mundo é permissão que ninguém tinha ainda. Segue o
  // par já existente `read:status` / `read:status:all`.
  //
  // Vai para quem tem `admin`, que é exatamente quem enxerga o painel. Note
  // que a feature `admin` continua não concedendo nada por si: é esta linha,
  // explícita, que dá a permissão — e é ela que alguém precisa reverter para
  // tirar o acesso, em vez de depender de um efeito colateral.
  //
  // Idempotente pelo NOT ... = ANY, porque o banco de preview pode estar em
  // qualquer ponto do histórico.
  pgm.sql(`
    UPDATE
      users
    SET
      features = array_append(features, 'read:user:all'),
      updated_at = timezone('utc', now())
    WHERE
      'admin' = ANY(features)
      AND NOT ('read:user:all' = ANY(features))
  `);
};

exports.down = false;
