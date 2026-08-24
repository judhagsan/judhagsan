import bcryptjs from "bcryptjs";
import email from "infra/email.js";
import webserver from "infra/webserver.js";

async function hash(password) {
  const rounds = getNumberOfRounds();
  return await bcryptjs.hash(password, rounds);
}

function getNumberOfRounds() {
  return process.env.NODE_ENV === "production" ? 14 : 1;
}

async function compare(providedPassword, storedPassword) {
  return await bcryptjs.compare(providedPassword, storedPassword);
}

async function sendChangedNoticeToUser(user) {
  await email.send({
    from: "Judhagsan <contato@judhagsan.com>",
    to: user.email,
    subject: "Sua senha em Judhagsan foi alterada",
    text: `${user.username}, a senha da sua conta em judhagsan.com acabou de ser alterada.

As outras sessões conectadas nesta conta foram encerradas.

Se foi você, não há nada a fazer.

Se não foi você, alguém tem acesso à sua conta e agora sabe a senha. Fale com a gente o quanto antes em ${webserver.origin}/contato.

Atenciosamente,
Equipe Judhagsan`,
  });
}

const password = {
  hash,
  compare,
  sendChangedNoticeToUser,
};

export default password;
