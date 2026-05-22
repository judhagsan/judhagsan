const REPO = "judhagsan/pindorama";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed" });
  }

  const token = process.env.PINDORAMA_RELEASES_PAT;
  if (!token) {
    return response.status(500).json({ error: "Token não configurado" });
  }

  try {
    const releaseResponse = await fetch(
      `https://api.github.com/repos/${REPO}/releases/latest`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "judhagsan-version-proxy",
          Accept: "application/vnd.github+json",
        },
      },
    );

    if (!releaseResponse.ok) {
      const detalhe = await releaseResponse.text().catch(() => "");
      console.error(
        `[version] GitHub respondeu ${releaseResponse.status}: ${detalhe.slice(0, 500)}`,
      );
      return response.status(502).json({
        error: "Falha ao consultar release do pindorama",
        github_status: releaseResponse.status,
      });
    }

    const release = await releaseResponse.json();
    const tag = release.tag_name;
    if (!tag) {
      return response
        .status(502)
        .json({ error: "Tag não encontrada na release" });
    }

    // Tenta buscar SHA256SUMS.txt do release. Formato esperado:
    //   <hash>  <filename>
    // Mapeamos cada filename para a plataforma do Pindorama.
    const sha256 = await fetchSha256Sums(release, token);

    response.setHeader("Cache-Control", "public, max-age=300");
    return response.status(200).json({
      tag,
      version: tag.replace(/^v/, ""),
      sha256,
    });
  } catch {
    return response
      .status(500)
      .json({ error: "Erro inesperado ao consultar versão" });
  }
}

async function fetchSha256Sums(release, token) {
  const sumsAsset = release.assets?.find((a) => a.name === "SHA256SUMS.txt");
  if (!sumsAsset) return null;

  try {
    const sumsResponse = await fetch(
      `https://api.github.com/repos/${REPO}/releases/assets/${sumsAsset.id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "judhagsan-version-proxy",
          Accept: "application/octet-stream",
        },
      },
    );

    if (!sumsResponse.ok) return null;

    const text = await sumsResponse.text();
    const sha256 = {};
    for (const line of text.split(/\r?\n/)) {
      const match = line.trim().match(/^([0-9a-fA-F]{64})\s+\*?(.+)$/);
      if (!match) continue;
      const [, hash, filename] = match;
      if (/windows|\.exe$/i.test(filename)) sha256.windows = hash;
      else if (/mac|\.dmg$/i.test(filename)) sha256.macos = hash;
      else if (/linux|AppImage/i.test(filename)) sha256.linux = hash;
    }
    return Object.keys(sha256).length > 0 ? sha256 : null;
  } catch {
    return null;
  }
}
