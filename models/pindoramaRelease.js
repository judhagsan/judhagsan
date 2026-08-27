import { ServiceError, NotFoundError } from "infra/errors.js";

const REPO = "judhagsan/pindorama";

// Nome do asset de cada plataforma, igual nos releases estáveis e nos
// prereleases de PR (os três workflows de build publicam com estes nomes).
const FILES = {
  windows: "Pindorama-Setup.exe",
  macos: "Pindorama-macOS-arm64.dmg",
  linux: "Pindorama-x86_64.AppImage",
};

// Builds de PR são publicadas com a tag `pr-<numero>` pelo workflow
// `prerelease-on-label.yaml` e apagadas pelo `prerelease-cleanup.yaml` quando o
// PR fecha. Ou seja: a existência do release É a resposta para "tem build de PR
// disponível agora?" — não precisamos consultar labels nem PRs abertos.
const PR_TAG_PREFIX = "pr-";

function githubHeaders(accept) {
  const token = process.env.PINDORAMA_RELEASES_PAT;
  if (!token) {
    throw new ServiceError({
      message: "Token de acesso aos releases do Pindorama não configurado.",
      action: "Defina PINDORAMA_RELEASES_PAT no ambiente.",
    });
  }
  return {
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "judhagsan-prerelease-proxy",
    Accept: accept,
  };
}

// A build de PR mais recente, ou `null` quando nenhum PR tem a label `build`
// no momento.
//
// `releases?per_page=30` em vez de `releases/latest`: o endpoint `latest`
// ignora prereleases por definição. A ordenação da API é por data de criação
// (mais recente primeiro), mas desempatamos por `published_at` porque um
// release pode ser criado e publicado em momentos diferentes.
async function findLatestPrerelease() {
  const response = await fetch(
    `https://api.github.com/repos/${REPO}/releases?per_page=30`,
    { headers: githubHeaders("application/vnd.github+json") },
  );

  if (!response.ok) {
    throw new ServiceError({
      message: `GitHub respondeu ${response.status} ao listar releases.`,
      action: "Tente novamente em alguns instantes.",
    });
  }

  return selectLatestPrerelease(await response.json());
}

// Regra PURA de seleção, separada da chamada de rede para ser testável: entre
// todos os releases do repositório, qual é a build de PR mais recente.
//
// Três filtros, cada um por um motivo próprio: `prerelease` exclui os releases
// estáveis; o prefixo `pr-` exclui prereleases que não vieram de PR (uma beta
// manual, por exemplo); e `draft` exclui o que ainda não tem asset publicado —
// esse apareceria como build disponível e falharia no download.
function selectLatestPrerelease(releases) {
  const candidates = (Array.isArray(releases) ? releases : [])
    .filter((release) => release.prerelease === true)
    .filter((release) =>
      String(release.tag_name || "").startsWith(PR_TAG_PREFIX),
    )
    .filter((release) => release.draft !== true);

  if (candidates.length === 0) return null;

  // A API já devolve por data de criação, mas um release pode ser criado e
  // publicado em momentos diferentes — o que vale para "a build mais recente"
  // é quando ela ficou publicada.
  candidates.sort((a, b) => {
    const da = Date.parse(a.published_at || a.created_at || 0);
    const db = Date.parse(b.published_at || b.created_at || 0);
    return db - da;
  });

  return candidates[0];
}

// Número do PR a partir da tag `pr-<numero>`. `null` quando a tag não segue o
// formato — não é erro, só não temos o número para exibir.
function prNumberFromTag(tag) {
  const match = String(tag || "").match(/^pr-(\d+)$/);
  return match ? Number(match[1]) : null;
}

// Resumo que o Pindorama consome para decidir se mostra o botão de build de
// teste. Sem versão semântica na resposta de propósito: build de PR não é
// "versão maior", é uma build sob demanda — quem instala está testando aquele
// PR, não atualizando.
async function prereleaseSummary() {
  const release = await findLatestPrerelease();
  if (!release) return { available: false };

  return {
    available: true,
    tag: release.tag_name,
    pr_number: prNumberFromTag(release.tag_name),
    name: release.name || null,
    published_at: release.published_at || release.created_at || null,
    // Quais plataformas de fato têm instalador nesse prerelease: um dos três
    // jobs de build pode ter falhado, e aí o botão não deve prometer download
    // para aquela plataforma.
    platforms: Object.keys(FILES).filter((platform) =>
      (release.assets || []).some((asset) => asset.name === FILES[platform]),
    ),
  };
}

// URL assinada (efêmera) do asset da plataforma no prerelease mais recente.
// Lança NotFoundError quando não há build de PR ou quando aquele job não
// publicou o instalador daquela plataforma.
async function prereleaseDownloadUrl(platform) {
  const filename = FILES[platform];
  if (!filename) {
    throw new NotFoundError({
      message: "Plataforma não suportada.",
      action: "Use windows, macos ou linux.",
    });
  }

  const release = await findLatestPrerelease();
  if (!release) {
    throw new NotFoundError({
      message: "Nenhuma build de PR disponível no momento.",
      action: "Adicione a label build a um PR aberto do Pindorama.",
    });
  }

  const asset = (release.assets || []).find((item) => item.name === filename);
  if (!asset) {
    throw new NotFoundError({
      message: `A build ${release.tag_name} não tem o instalador de ${platform}.`,
      action: "Verifique se o job daquela plataforma concluiu no workflow.",
    });
  }

  const assetResponse = await fetch(
    `https://api.github.com/repos/${REPO}/releases/assets/${asset.id}`,
    {
      headers: githubHeaders("application/octet-stream"),
      redirect: "manual",
    },
  );

  const signedUrl = assetResponse.headers.get("location");
  if (!signedUrl) {
    throw new ServiceError({
      message: "Falha ao obter a URL assinada do asset.",
      action: "Tente novamente em alguns instantes.",
    });
  }

  return signedUrl;
}

const pindoramaRelease = {
  FILES,
  findLatestPrerelease,
  selectLatestPrerelease,
  prNumberFromTag,
  prereleaseSummary,
  prereleaseDownloadUrl,
};

export default pindoramaRelease;
