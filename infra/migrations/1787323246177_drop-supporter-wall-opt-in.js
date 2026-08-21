exports.up = (pgm) => {
  // O mural de apoiadores deixou de ser opt-in: todo apoiador aparece, e a
  // escolha de não aparecer não existe mais em lugar nenhum — nem na tela, nem
  // na rota `PATCH /api/v1/user/supporter` (removida), nem no payload de
  // `/api/v1/user`. A coluna virou dado morto.
  //
  // Só esconder a caixa teria sido pior: quem já tivesse desmarcado ficaria
  // invisível para sempre, sem interface para reverter. Por isso o filtro saiu
  // primeiro do `listPublic`, e é isso que esta migration acompanha.
  //
  // `ifExists` porque o banco de preview pode estar em qualquer ponto do
  // histórico, e a migration precisa rodar nos dois casos.
  pgm.dropColumns("users", ["supporter_wall_opt_in"], { ifExists: true });
};

exports.down = false;
