exports.up = (pgm) => {
  // O painel ganhou o botão de conceder e revogar apoio. Poder dar benefício
  // pago de graça é diferente de poder editar o username de alguém, então tem
  // feature própria em vez de pegar carona em `update:user:others` — quem tiver
  // uma não herda a outra sem alguém decidir isso.
  //
  // Vai para quem tem `admin`, mantendo a regra: `admin` diz quem vê o painel,
  // e cada poder dentro dele é concedido explicitamente, por uma linha que
  // alguém pode remover para tirar o acesso.
  pgm.sql(`
    UPDATE
      users
    SET
      features = array_append(features, 'manage:supporter'),
      updated_at = timezone('utc', now())
    WHERE
      'admin' = ANY(features)
      AND NOT ('manage:supporter' = ANY(features))
  `);
};

exports.down = false;
