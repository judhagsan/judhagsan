import database from "infra/database.js";
import password from "models/password.js";
import emailValidation from "infra/emailValidation.js";
import { ValidationError, NotFoundError } from "infra/errors.js";

const UPDATABLE_FIELDS = ["username", "email"];

async function findOneById(id) {
  const userFound = await runSelectQuery(id);

  return userFound;

  async function runSelectQuery(id) {
    const results = await database.query({
      text: `
        SELECT
          *
        FROM
          users
        WHERE
          id = $1
        LIMIT
          1
        ;`,
      values: [id],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "O id informado não foi encontrado no sistema.",
        action: "Verifique se o id está digitado corretamente.",
      });
    }

    return results.rows[0];
  }
}

async function findOneByUsername(username) {
  const userFound = await runSelectQuery(username);

  return userFound;

  async function runSelectQuery(username) {
    const results = await database.query({
      text: `
        SELECT
          *
        FROM
          users
        WHERE
          LOWER(username) = LOWER($1)
        LIMIT
          1
        ;`,
      values: [username],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "O username informado não foi encontrado no sistema.",
        action: "Verifique se o username está digitado corretamente.",
      });
    }

    return results.rows[0];
  }
}

async function findOneByEmail(email) {
  const userFound = await runSelectQuery(email);

  return userFound;

  async function runSelectQuery(email) {
    const results = await database.query({
      text: `
        SELECT
          *
        FROM
          users
        WHERE
          LOWER(email) = LOWER($1)
        LIMIT
          1
        ;`,
      values: [email],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "O email informado não foi encontrado no sistema.",
        action: "Verifique se o email está digitado corretamente.",
      });
    }

    return results.rows[0];
  }
}

async function create(userInputValues) {
  validatePrivacyAcceptance(userInputValues);
  validatePasswordComplexity(userInputValues.password);
  await validateUniqueUsername(userInputValues.username);
  // Formato + domínio com MX antes de gravar/enviar ativação: evita cadastrar
  // (e mandar email para) endereços malformados ou de domínios que não existem.
  userInputValues.email = await emailValidation.assertValidEmail(
    userInputValues.email,
  );
  await validateUniqueEmail(userInputValues.email);
  await hashPasswordInObject(userInputValues);
  injectDefaultFeaturesInObject(userInputValues);
  stampPrivacyAcceptedAt(userInputValues);

  const newUser = await runInsertQuery(userInputValues);
  return newUser;

  async function runInsertQuery(userInputValues) {
    const results = await database.query({
      text: `
        INSERT INTO
          users (username, email, password, features, privacy_accepted_at)
        VALUES
          ($1, $2, $3, $4, $5)
        RETURNING
          *
        ;`,
      values: [
        userInputValues.username,
        userInputValues.email,
        userInputValues.password,
        userInputValues.features,
        userInputValues.privacy_accepted_at,
      ],
    });
    return results.rows[0];
  }

  function injectDefaultFeaturesInObject(userInputValues) {
    userInputValues.features = ["read:activation_token"];
  }

  function stampPrivacyAcceptedAt(userInputValues) {
    userInputValues.privacy_accepted_at = new Date();
  }
}

function validatePrivacyAcceptance(userInputValues) {
  if (userInputValues.privacy_accepted !== true) {
    throw new ValidationError({
      message: "É necessário aceitar os Termos de Uso para se cadastrar.",
      action: "Marque a opção de aceite e tente novamente.",
    });
  }
}

function validatePasswordComplexity(password) {
  if (typeof password !== "string" || password.length < 8) {
    throw new ValidationError({
      message: "A senha deve ter no mínimo 8 caracteres.",
      action: "Escolha uma senha com pelo menos 8 caracteres.",
    });
  }
  if (password.length > 72) {
    throw new ValidationError({
      message: "A senha deve ter no máximo 72 caracteres.",
      action: "Reduza o tamanho da senha.",
    });
  }
}

async function update(username, userInputValues) {
  // Um PATCH sem corpo chega aqui como `undefined`, e o `in` abaixo estourava
  // TypeError — 500 numa requisição que é só malformada. Normalizar para `{}`
  // faz esse caso terminar igual ao corpo vazio, que já respondia 200.
  const inputValues = userInputValues || {};

  // A senha não passa por aqui: trocá-la exige confirmar a senha atual, o que
  // é responsabilidade de `updatePasswordById`. Sem esta guarda, um `password`
  // no corpo seria gravado em texto puro pelo spread abaixo.
  if ("password" in inputValues) {
    throw new ValidationError({
      message: "A senha não pode ser alterada por este endpoint.",
      action: "Utilize o endpoint de alteração de senha.",
    });
  }

  validateOnlyUpdatableFields(inputValues);

  const currentUser = await findOneByUsername(username);

  if ("username" in inputValues) {
    await validateUniqueUsername(inputValues.username);
  }

  if ("email" in inputValues) {
    await validateUniqueEmail(inputValues.email);
  }

  const userWithNewValues = { ...currentUser, ...inputValues };

  const updatedUser = await runUpdateQuery(userWithNewValues);
  return updatedUser;

  async function runUpdateQuery(userWithNewValues) {
    const results = await database.query({
      text: `
        UPDATE
          users
        SET
          username = $2,
          email = $3,
          password = $4,
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          *
      `,
      values: [
        userWithNewValues.id,
        userWithNewValues.username,
        userWithNewValues.email,
        userWithNewValues.password,
      ],
    });

    return results.rows[0];
  }
}

async function updatePasswordById(userId, newPassword) {
  validatePasswordComplexity(newPassword);

  const hashedPassword = await password.hash(newPassword);
  const updatedUser = await runUpdateQuery(userId, hashedPassword);

  return updatedUser;

  async function runUpdateQuery(userId, hashedPassword) {
    const results = await database.query({
      text: `
        UPDATE
          users
        SET
          password = $2,
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          *
        ;`,
      values: [userId, hashedPassword],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "O id informado não foi encontrado no sistema.",
        action: "Verifique se o id está digitado corretamente.",
      });
    }

    return results.rows[0];
  }
}

/*
 * O UPDATE abaixo escreve username, email e password — e password tem guarda
 * própria. Qualquer outro campo do corpo era descartado em silêncio, com a
 * resposta 200 dizendo que deu certo. Não era brecha (`features` e `id` nunca
 * chegaram ao SQL, então ninguém se promovia por aqui), mas é contrato
 * mentiroso: quem manda `features: ["admin"]` merece ouvir que este endpoint
 * não faz isso, em vez de um "ok" que não aconteceu.
 */
function validateOnlyUpdatableFields(userInputValues) {
  const unknownFields = Object.keys(userInputValues).filter(
    (field) => !UPDATABLE_FIELDS.includes(field),
  );

  if (unknownFields.length > 0) {
    throw new ValidationError({
      message: `Não é possível atualizar: ${unknownFields.join(", ")}.`,
      action: `Este endpoint atualiza apenas: ${UPDATABLE_FIELDS.join(", ")}.`,
    });
  }
}

async function validateUniqueUsername(username) {
  const results = await database.query({
    text: `
      SELECT
        username
      FROM
        users
      WHERE
        LOWER(username) = LOWER($1)
      ;`,
    values: [username],
  });

  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "O username informado já está sendo utilizado.",
      action: "Utilize outro username para realizar esta operação.",
    });
  }
}

async function validateUniqueEmail(email) {
  const results = await database.query({
    text: `
      SELECT
        email
      FROM
        users
      WHERE
        LOWER(email) = LOWER($1)
      ;`,
    values: [email],
  });

  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "O email informado já está sendo utilizado.",
      action: "Utilize outro email para realizar esta operação.",
    });
  }
}

async function hashPasswordInObject(userInputValues) {
  const hashedPassword = await password.hash(userInputValues.password);
  userInputValues.password = hashedPassword;
}

async function remove(username) {
  const removedUser = await runDeleteQuery(username);
  return removedUser;

  async function runDeleteQuery(username) {
    const results = await database.query({
      text: `
        DELETE FROM
          users
        WHERE
          LOWER(username) = LOWER($1)
        RETURNING
          *
        ;`,
      values: [username],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "O username informado não foi encontrado no sistema.",
        action: "Verifique se o username está digitado corretamente.",
      });
    }

    return results.rows[0];
  }
}

async function setFeatures(userId, features) {
  const updatedUser = await runUpdateQuery(userId, features);
  return updatedUser;

  async function runUpdateQuery(userId, features) {
    const results = await database.query({
      text: `
       UPDATE
         users
       SET
         features = $2,
         updated_at = timezone('utc', now())
       WHERE
         id = $1
       RETURNING
         *
       ;`,
      values: [userId, features],
    });

    return results.rows[0];
  }
}

async function addFeatures(userId, features) {
  const updatedUser = await runUpdateQuery(userId, features);
  return updatedUser;

  async function runUpdateQuery(userId, features) {
    const results = await database.query({
      text: `
       UPDATE
         users
       SET
         features = array_cat(features, $2),
         updated_at = timezone('utc', now())
       WHERE
         id = $1
       RETURNING
         *
       ;`,
      values: [userId, features],
    });

    return results.rows[0];
  }
}

const user = {
  create,
  findOneById,
  findOneByUsername,
  findOneByEmail,
  update,
  updatePasswordById,
  remove,
  setFeatures,
  addFeatures,
};

export default user;
