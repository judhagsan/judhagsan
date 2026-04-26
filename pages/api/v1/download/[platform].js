const FILES = {
  windows: "Pindorama-Setup.exe",
  macos: "Pindorama-macOS-arm64.dmg",
  linux: "Pindorama-x86_64.AppImage",
};

const REPO = "judhagsan/pindorama";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed" });
  }

  const platform = String(request.query.platform || "").toLowerCase();
  const filename = FILES[platform];

  if (!filename) {
    return response.status(404).json({ error: "Plataforma não suportada" });
  }

  const token = process.env.PINDORAMA_RELEASES_PAT;
  if (!token) {
    return response.status(500).json({ error: "Token não configurado" });
  }

  const githubHeaders = {
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "judhagsan-download-proxy",
  };

  try {
    const releaseResponse = await fetch(
      `https://api.github.com/repos/${REPO}/releases/latest`,
      {
        headers: { ...githubHeaders, Accept: "application/vnd.github+json" },
      },
    );

    if (!releaseResponse.ok) {
      return response
        .status(502)
        .json({ error: "Falha ao consultar release do pindorama" });
    }

    const release = await releaseResponse.json();
    const asset = release.assets?.find((item) => item.name === filename);

    if (!asset) {
      return response
        .status(404)
        .json({ error: `Asset "${filename}" não encontrado na release` });
    }

    const assetResponse = await fetch(
      `https://api.github.com/repos/${REPO}/releases/assets/${asset.id}`,
      {
        headers: { ...githubHeaders, Accept: "application/octet-stream" },
        redirect: "manual",
      },
    );

    const signedUrl = assetResponse.headers.get("location");
    if (!signedUrl) {
      return response
        .status(502)
        .json({ error: "Falha ao obter URL assinada do asset" });
    }

    response.setHeader("Cache-Control", "no-store");
    return response.redirect(302, signedUrl);
  } catch {
    return response
      .status(500)
      .json({ error: "Erro inesperado ao processar download" });
  }
}
