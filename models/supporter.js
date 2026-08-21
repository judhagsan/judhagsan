import database from "infra/database.js";
import email from "infra/email.js";
import webserver from "infra/webserver.js";
import user from "models/user.js";
import { ValidationError } from "infra/errors.js";

// Feature concedida a quem apoia o Pindorama. Vem da assinatura mensal no
// Mercado Pago (ver `models/mercadopago.js`) e também pode ser concedida à mão.
const FEATURE = "apoiador";

// Valor do apoio mensal, em reais. Fica aqui porque é regra do apoio, não do
// gateway: a tela, a assinatura e o Pix de reposição leem todos daqui.
const MONTHLY_VALUE = 9.9;

// Janela mínima entre dois avisos de cobrança recusada para a mesma pessoa. O
// Mercado Pago retenta por até 10 dias e notifica cada tentativa; sem isto,
// quem teve o cartão recusado receberia um e-mail por tentativa.
const DECLINE_NOTICE_COOLDOWN_IN_DAYS = 7;

async function listPublic() {
  const results = await database.query({
    text: `
      SELECT
        username
      FROM
        users
      WHERE
        -- Sem filtro de opt-in: o mural lista todo mundo que apoia. A escolha
        -- de aparecer ou não deixou de existir junto com a caixa que a
        -- oferecia, e manter o filtro aqui esconderia para sempre quem tivesse
        -- desmarcado antes.
        $1 = ANY(features)
      ORDER BY
        LOWER(username)
      ;`,
    values: [FEATURE],
  });

  return results.rows;
}

async function setDiscordId(userId, discordUserId) {
  try {
    const results = await database.query({
      text: `
        UPDATE
          users
        SET
          discord_user_id = $2,
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          *
        ;`,
      values: [userId, discordUserId],
    });

    return results.rows[0];
  } catch (error) {
    if (error?.cause?.code === "23505") {
      throw new ValidationError({
        message: "Esta conta do Discord já está vinculada a outro usuário.",
        action:
          "Use outra conta do Discord ou desvincule-a do outro usuário antes.",
      });
    }
    throw error;
  }
}

async function grant(userId) {
  const userFound = await user.findOneById(userId);

  if (userFound.features.includes(FEATURE)) {
    return userFound;
  }

  return await user.addFeatures(userId, [FEATURE]);
}

async function revoke(userId) {
  const userFound = await user.findOneById(userId);

  const remainingFeatures = userFound.features.filter(
    (feature) => feature !== FEATURE,
  );

  return await user.setFeatures(userId, remainingFeatures);
}

// Concede a feature com prazo. O prazo é carência, não cobrança: o Mercado
// Pago retenta uma cobrança rejeitada por até 10 dias, e ninguém pode perder o
// acesso enquanto essa régua ainda está rodando. Quem revoga é o cron.
async function grantUntil(userId, until) {
  await grant(userId);

  const results = await database.query({
    text: `
      UPDATE
        users
      SET
        supporter_until = $2,
        -- Cobrança aprovada fecha o ciclo da recusa anterior: a próxima que
        -- falhar volta a poder avisar.
        supporter_declined_notified_at = NULL,
        updated_at = timezone('utc', now())
      WHERE
        id = $1
      RETURNING
        *
      ;`,
    values: [userId, until],
  });

  return results.rows[0];
}

// Roda no cron diário. Só mexe em quem tem prazo: apoiador concedido à mão
// (sem `supporter_until`) nunca expira sozinho.
async function expireOverdue() {
  const results = await database.query({
    text: `
      UPDATE
        users
      SET
        features = array_remove(features, $1),
        updated_at = timezone('utc', now())
      WHERE
        $1 = ANY(features)
        AND supporter_until IS NOT NULL
        AND supporter_until < timezone('utc', now())
      RETURNING
        id
      ;`,
    values: [FEATURE],
  });

  return results.rowCount;
}

// Avisa por e-mail que a cobrança do apoio não passou.
//
// Quem descobre a recusa é o webhook, uma hora ou um mês depois de a pessoa
// ter assinado — ninguém está olhando a tela nesse momento, então nenhuma
// interface resolve isto. O e-mail do Mercado Pago é recibo de transação; este
// aqui diz o que acontece com o apoio e o que dá para fazer a respeito.
//
// O UPDATE condicional é o próprio trinco: quem não conseguir marcar é porque
// outro avisou primeiro, e devolve `false` sem mandar nada.
async function notifyChargeDeclined(userId) {
  const results = await database.query({
    text: `
      UPDATE
        users
      SET
        supporter_declined_notified_at = timezone('utc', now()),
        updated_at = timezone('utc', now())
      WHERE
        id = $1
        AND (
          supporter_declined_notified_at IS NULL
          OR supporter_declined_notified_at
             < timezone('utc', now()) - $2::interval
        )
      RETURNING
        *
      ;`,
    values: [userId, `${DECLINE_NOTICE_COOLDOWN_IN_DAYS} days`],
  });

  if (results.rowCount === 0) {
    return false;
  }

  const notifiedUser = results.rows[0];

  try {
    await email.send({
      from: "Judhagsan <contato@judhagsan.com>",
      to: notifiedUser.email,
      subject: "A cobrança do seu apoio ao Pindorama não foi aprovada",
      text: `${notifiedUser.username}, a cobrança mensal do seu apoio ao Pindorama não passou desta vez.

O Mercado Pago vai tentar de novo sozinho, por até 10 dias, e seu acesso de apoiador continua durante esse período. Você não precisa fazer nada agora.

Se preferir resolver na hora, dá para pagar um mês com Pix — ou cancelar o apoio, se não quiser mais. Os dois estão em:

${webserver.origin}/sessao

Atenciosamente,
Equipe Judhagsan`,
    });
  } catch (error) {
    // Falhou o envio: desfaz a marca, senão a pessoa fica sete dias sem poder
    // ser avisada por causa de um e-mail que nunca saiu.
    await database.query({
      text: `
        UPDATE
          users
        SET
          supporter_declined_notified_at = $2
        WHERE
          id = $1
        ;`,
      values: [userId, notifiedUser.supporter_declined_notified_at],
    });

    throw error;
  }

  return true;
}

async function setSubscription(userId, { preapprovalId, status }) {
  const results = await database.query({
    text: `
      UPDATE
        users
      SET
        mercadopago_preapproval_id = COALESCE($2, mercadopago_preapproval_id),
        mercadopago_status = $3,
        updated_at = timezone('utc', now())
      WHERE
        id = $1
      RETURNING
        *
      ;`,
    values: [userId, preapprovalId, status],
  });

  return results.rows[0];
}

const supporter = {
  FEATURE,
  MONTHLY_VALUE,
  listPublic,
  setDiscordId,
  grant,
  grantUntil,
  revoke,
  expireOverdue,
  notifyChargeDeclined,
  setSubscription,
};

export default supporter;
