import database from "infra/database.js";
import user from "models/user.js";
import { ValidationError } from "infra/errors.js";

// Feature concedida a quem apoia o Pindorama. Vem da assinatura mensal no
// Mercado Pago (ver `models/mercadopago.js`) e também pode ser concedida à mão.
const FEATURE = "apoiador";

// Valor do apoio mensal, em reais. Fica aqui porque é regra do apoio, não do
// gateway: a tela, a assinatura e o Pix de reposição leem todos daqui.
const MONTHLY_VALUE = 9.9;

async function listPublic() {
  const results = await database.query({
    text: `
      SELECT
        username
      FROM
        users
      WHERE
        $1 = ANY(features)
        AND supporter_wall_opt_in = true
      ORDER BY
        LOWER(username)
      ;`,
    values: [FEATURE],
  });

  return results.rows;
}

async function setWallOptIn(userId, optIn) {
  const results = await database.query({
    text: `
      UPDATE
        users
      SET
        supporter_wall_opt_in = $2,
        updated_at = timezone('utc', now())
      WHERE
        id = $1
      RETURNING
        *
      ;`,
    values: [userId, optIn],
  });

  return results.rows[0];
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

  await user.addFeatures(userId, [FEATURE]);
  // Ao virar apoiador pela primeira vez, entra no mural público por padrão.
  // O apoiador pode desativar isso depois em /sessao.
  return await setWallOptIn(userId, true);
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
  setWallOptIn,
  setDiscordId,
  grant,
  grantUntil,
  revoke,
  expireOverdue,
  setSubscription,
};

export default supporter;
