import { ServiceError } from "infra/errors.js";

const API_BASE_URL = "https://discord.com/api/v10";
const AUTHORIZE_URL = "https://discord.com/oauth2/authorize";
const OAUTH_SCOPES = "identify guilds.join";

function getConfiguration() {
  const configuration = {
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    botToken: process.env.DISCORD_BOT_TOKEN,
    guildId: process.env.DISCORD_GUILD_ID,
    supporterRoleId: process.env.DISCORD_SUPPORTER_ROLE_ID,
    redirectUri: process.env.DISCORD_REDIRECT_URI,
  };

  const missingValues = Object.entries(configuration)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingValues.length > 0) {
    throw new ServiceError({
      message: "A integração com o Discord não está configurada.",
      cause: `Variáveis de ambiente ausentes: ${missingValues.join(", ")}`,
    });
  }

  return configuration;
}

function getAuthorizationUrl(state) {
  const configuration = getConfiguration();

  const params = new URLSearchParams({
    client_id: configuration.clientId,
    redirect_uri: configuration.redirectUri,
    response_type: "code",
    scope: OAUTH_SCOPES,
    state,
  });

  return `${AUTHORIZE_URL}?${params}`;
}

async function exchangeCodeForToken(code) {
  const configuration = getConfiguration();

  const tokenResponse = await fetch(`${API_BASE_URL}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: configuration.clientId,
      client_secret: configuration.clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: configuration.redirectUri,
    }),
  });

  if (!tokenResponse.ok) {
    throw new ServiceError({
      message: "Falha ao autenticar com o Discord.",
      cause: `Discord respondeu ${tokenResponse.status} na troca do code.`,
    });
  }

  const tokenBody = await tokenResponse.json();
  return tokenBody.access_token;
}

async function fetchProfile(accessToken) {
  const profileResponse = await fetch(`${API_BASE_URL}/users/@me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!profileResponse.ok) {
    throw new ServiceError({
      message: "Falha ao consultar o perfil no Discord.",
      cause: `Discord respondeu ${profileResponse.status} em /users/@me.`,
    });
  }

  const profile = await profileResponse.json();
  return {
    id: profile.id,
    username: profile.username,
  };
}

async function addToGuildWithSupporterRole(discordUserId, accessToken) {
  const configuration = getConfiguration();

  const botHeaders = {
    Authorization: `Bot ${configuration.botToken}`,
    "Content-Type": "application/json",
  };

  // Adiciona o usuário ao servidor já com o cargo de apoiador. Se ele já for
  // membro, o Discord responde 204 e ignora `roles`, então o cargo precisa
  // ser atribuído em uma segunda chamada.
  const joinResponse = await fetch(
    `${API_BASE_URL}/guilds/${configuration.guildId}/members/${discordUserId}`,
    {
      method: "PUT",
      headers: botHeaders,
      body: JSON.stringify({
        access_token: accessToken,
        roles: [configuration.supporterRoleId],
      }),
    },
  );

  if (joinResponse.status === 201) {
    return;
  }

  if (joinResponse.status !== 204) {
    throw new ServiceError({
      message: "Falha ao entrar no servidor do Discord.",
      cause: `Discord respondeu ${joinResponse.status} ao adicionar o membro.`,
    });
  }

  const roleResponse = await fetch(
    `${API_BASE_URL}/guilds/${configuration.guildId}/members/${discordUserId}/roles/${configuration.supporterRoleId}`,
    {
      method: "PUT",
      headers: botHeaders,
    },
  );

  if (roleResponse.status !== 204) {
    throw new ServiceError({
      message: "Falha ao atribuir o cargo de apoiador no Discord.",
      cause: `Discord respondeu ${roleResponse.status} ao atribuir o cargo.`,
    });
  }
}

async function removeSupporterRole(discordUserId) {
  const configuration = getConfiguration();

  const roleResponse = await fetch(
    `${API_BASE_URL}/guilds/${configuration.guildId}/members/${discordUserId}/roles/${configuration.supporterRoleId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bot ${configuration.botToken}`,
      },
    },
  );

  // 404 = usuário saiu do servidor; nada a remover.
  if (roleResponse.status !== 204 && roleResponse.status !== 404) {
    throw new ServiceError({
      message: "Falha ao remover o cargo de apoiador no Discord.",
      cause: `Discord respondeu ${roleResponse.status} ao remover o cargo.`,
    });
  }
}

const discord = {
  getAuthorizationUrl,
  exchangeCodeForToken,
  fetchProfile,
  addToGuildWithSupporterRole,
  removeSupporterRole,
};

export default discord;
