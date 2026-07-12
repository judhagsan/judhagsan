import database from "infra/database.js";
import user from "models/user.js";
import { ValidationError } from "infra/errors.js";

// Feature concedida a quem apoia o Pindorama. Hoje é concedida manualmente;
// quando a cobrança recorrente (AbacatePay) entrar, o webhook de assinatura
// passa a chamar `grant`/`revoke`.
const FEATURE = "apoiador";

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

  return await user.addFeatures(userId, [FEATURE]);
}

async function revoke(userId) {
  const userFound = await user.findOneById(userId);

  const remainingFeatures = userFound.features.filter(
    (feature) => feature !== FEATURE,
  );

  return await user.setFeatures(userId, remainingFeatures);
}

const supporter = {
  FEATURE,
  listPublic,
  setWallOptIn,
  setDiscordId,
  grant,
  revoke,
};

export default supporter;
