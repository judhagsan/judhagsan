import { InternalServerError } from "infra/errors.js";

const availableFeatures = [
  // ADMIN
  // Marcador explícito, gravado em `users.features`, de quem enxerga o painel
  // administrativo. Não concede nada por si: cada ação continua exigindo a sua
  // feature granular (`update:user:others` e companhia). A separação é de
  // propósito — "vê o painel" e "pode mexer em outro usuário" são perguntas
  // diferentes, e antes o painel inferia a primeira a partir da segunda.
  "admin",

  // USER
  "create:user",
  "read:user",
  "read:user:self",
  // Listar todos os usuários cadastrados. Segue o par `read:status` /
  // `read:status:all`: o singular é o dado público de um usuário, o `:all` é a
  // visão administrativa da base inteira.
  "read:user:all",
  "update:user",
  "update:user:others",
  "delete:user",
  "delete:user:others",

  // SESSION
  "create:session",
  "read:session",

  // ACTIVATION_TOKEN
  "read:activation_token",

  // MIGRATION
  "create:migration",
  "read:migration",

  // STATUS
  "read:status",
  "read:status:all",

  // DEVICES (telemetria de hardware do Pindorama)
  "manage:device",

  // APOIADOR (apoio recorrente ao Pindorama)
  "apoiador",
  // Conceder e revogar `apoiador` na conta de outra pessoa, pelo painel.
  // Separada de `update:user:others` de propósito: editar username de alguém e
  // dar benefício pago de graça são poderes diferentes, e quem tem um não
  // precisa herdar o outro.
  "manage:supporter",
];

function can(user, feature, resource) {
  validateUser(user);
  validateFeature(feature);

  let authorized = false;

  if (user.features.includes(feature)) {
    authorized = true;
  }

  if (feature === "update:user" && resource) {
    authorized = false;

    if (user.id === resource.id || can(user, "update:user:others")) {
      authorized = true;
    }
  }

  if (feature === "delete:user" && resource) {
    authorized = false;

    if (user.id === resource.id || can(user, "delete:user:others")) {
      authorized = true;
    }
  }

  return authorized;
}

function filterOutput(user, feature, resource) {
  validateUser(user);
  validateFeature(feature);
  validateResource(resource);

  if (feature === "read:user") {
    return {
      id: resource.id,
      username: resource.username,
      features: resource.features,
      created_at: resource.created_at,
      updated_at: resource.updated_at,
    };
  }

  if (feature === "read:user:self") {
    if (user.id === resource.id) {
      return {
        id: resource.id,
        username: resource.username,
        email: resource.email,
        features: resource.features,
        discord_connected: Boolean(resource.discord_user_id),
        created_at: resource.created_at,
        updated_at: resource.updated_at,
      };
    }
  }

  if (feature === "read:user:all") {
    // Recebe a lista inteira e devolve mapeada. O email entra porque é a visão
    // administrativa da base — mas a senha e os identificadores de pagamento
    // (`mercadopago_*`) ficam de fora: o painel não precisa deles, e o que não
    // sai daqui não vaza por descuido na tela.
    return resource.map((userFound) => {
      return {
        id: userFound.id,
        username: userFound.username,
        email: userFound.email,
        features: userFound.features,
        created_at: userFound.created_at,
        updated_at: userFound.updated_at,
      };
    });
  }

  if (feature === "read:session") {
    if (user.id === resource.user_id) {
      return {
        id: resource.id,
        token: resource.token,
        user_id: resource.user_id,
        created_at: resource.created_at,
        updated_at: resource.updated_at,
        expires_at: resource.expires_at,
      };
    }
  }

  if (feature === "read:activation_token") {
    return {
      id: resource.id,
      user_id: resource.user_id,
      created_at: resource.created_at,
      updated_at: resource.updated_at,
      expires_at: resource.expires_at,
      used_at: resource.used_at,
    };
  }

  if (feature === "read:migration") {
    return resource.map((migration) => {
      return {
        path: migration.path,
        name: migration.name,
        timestamp: migration.timestamp,
      };
    });
  }

  if (feature === "read:status") {
    const output = {
      updated_at: resource.updated_at,
      dependencies: {
        database: {
          max_connections: resource.dependencies.database.max_connections,
          opened_connections: resource.dependencies.database.opened_connections,
        },
      },
    };

    if (can(user, "read:status:all")) {
      output.dependencies.database.version =
        resource.dependencies.database.version;
    }

    return output;
  }
}

function validateUser(user) {
  if (!user || !user.features) {
    throw new InternalServerError({
      cause: "É necessário fornecer `user` no model `authorization`.",
    });
  }
}

function validateFeature(feature) {
  if (!feature || !availableFeatures.includes(feature)) {
    throw new InternalServerError({
      cause:
        "É necessário fornecer uma `feature` conhecida no model `authorization`.",
    });
  }
}

function validateResource(resource) {
  if (!resource) {
    throw new InternalServerError({
      cause:
        "É necessário fornecer um `resource` em `authorization.filterOutput()`.",
    });
  }
}

const authorization = {
  can,
  filterOutput,
};

export default authorization;
