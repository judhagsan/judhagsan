import orchestrator from "tests/orchestrator.js";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

async function authenticatedFetch(path, sessionToken) {
  return fetch(`${webserver.origin}${path}`, {
    redirect: "manual",
    headers: { Cookie: `session_id=${sessionToken}` },
  });
}

// Cria um usuário ativado com as features pedidas e devolve o token de sessão.
async function sessionWithFeatures(username, features) {
  const userObject = await orchestrator.createUser({ username });
  await orchestrator.activateUser(userObject);
  if (features.length > 0) {
    await orchestrator.addFeaturesToUser(userObject, features);
  }
  const session = await orchestrator.createSession(userObject);
  return session.token;
}

// O acesso é o que estes testes verificam. O CONTEÚDO da resposta depende do
// GitHub (existe build de PR agora?) e do PINDORAMA_RELEASES_PAT, que não está
// no ambiente de teste — então o caso autorizado afirma apenas que NÃO é 403:
// passou pela autorização e seguiu para o proxy. Um 403 aqui significaria que
// a regra de features quebrou, que é o que não pode acontecer em silêncio.
function expectNotForbidden(status) {
  expect(status).not.toBe(403);
}

describe("GET /api/v1/prerelease", () => {
  test("Anônimo não acessa", async () => {
    const response = await fetch(`${webserver.origin}/api/v1/prerelease`);
    expect(response.status).toBe(403);
  });

  test("Usuário comum não acessa", async () => {
    const token = await sessionWithFeatures("prerelease_comum", []);
    const response = await authenticatedFetch("/api/v1/prerelease", token);
    expect(response.status).toBe(403);
  });

  test("Só admin não basta", async () => {
    // As duas features são exigidas juntas: build interna (admin) que é
    // benefício de quem apoia (apoiador).
    const token = await sessionWithFeatures("prerelease_so_admin", ["admin"]);
    const response = await authenticatedFetch("/api/v1/prerelease", token);
    expect(response.status).toBe(403);
  });

  test("Só apoiador não basta", async () => {
    const token = await sessionWithFeatures("prerelease_so_apoiador", [
      "apoiador",
    ]);
    const response = await authenticatedFetch("/api/v1/prerelease", token);
    expect(response.status).toBe(403);
  });

  test("Admin + apoiador passa pela autorização", async () => {
    const token = await sessionWithFeatures("prerelease_admin_apoiador", [
      "admin",
      "apoiador",
    ]);
    const response = await authenticatedFetch("/api/v1/prerelease", token);
    expectNotForbidden(response.status);
  });

  test("Não aceita POST", async () => {
    const token = await sessionWithFeatures("prerelease_post", [
      "admin",
      "apoiador",
    ]);
    const response = await fetch(`${webserver.origin}/api/v1/prerelease`, {
      method: "POST",
      headers: { Cookie: `session_id=${token}` },
    });
    expect(response.status).toBe(405);
  });
});

describe("GET /api/v1/prerelease/download/[platform]", () => {
  test("Anônimo não baixa", async () => {
    const response = await fetch(
      `${webserver.origin}/api/v1/prerelease/download/windows`,
      { redirect: "manual" },
    );
    expect(response.status).toBe(403);
  });

  test("Usuário comum não baixa", async () => {
    const token = await sessionWithFeatures("prerelease_dl_comum", []);
    const response = await authenticatedFetch(
      "/api/v1/prerelease/download/windows",
      token,
    );
    expect(response.status).toBe(403);
  });

  test("Só apoiador não baixa", async () => {
    const token = await sessionWithFeatures("prerelease_dl_apoiador", [
      "apoiador",
    ]);
    const response = await authenticatedFetch(
      "/api/v1/prerelease/download/macos",
      token,
    );
    expect(response.status).toBe(403);
  });

  test("Admin + apoiador passa pela autorização", async () => {
    const token = await sessionWithFeatures("prerelease_dl_ok", [
      "admin",
      "apoiador",
    ]);
    const response = await authenticatedFetch(
      "/api/v1/prerelease/download/linux",
      token,
    );
    expectNotForbidden(response.status);
  });

  test("Plataforma inválida é rejeitada antes de consultar o GitHub", async () => {
    // 404 (e não 403): a autorização passou e o erro é do parâmetro. Também
    // garante que a lista de plataformas não virou aberta.
    const token = await sessionWithFeatures("prerelease_dl_plataforma", [
      "admin",
      "apoiador",
    ]);
    const response = await authenticatedFetch(
      "/api/v1/prerelease/download/atari",
      token,
    );
    expect(response.status).toBe(404);
  });
});
