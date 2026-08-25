exports.up = (pgm) => {
  // O painel ganhou o card de hardware, que lê a telemetria de todo mundo.
  // Separada de `manage:device`, que é sobre os próprios aparelhos: ver o
  // parque inteiro e pausar o upload do seu notebook são poderes diferentes,
  // e todo usuário ativado tem o segundo.
  //
  // Vai para quem tem `admin`, mantendo a regra do painel: `admin` diz quem vê
  // a tela, e cada poder dentro dela é uma linha explícita que alguém pode
  // remover para tirar o acesso.
  pgm.sql(`
    UPDATE
      users
    SET
      features = array_append(features, 'read:device:all'),
      updated_at = timezone('utc', now())
    WHERE
      'admin' = ANY(features)
      AND NOT ('read:device:all' = ANY(features))
  `);
};

exports.down = false;
