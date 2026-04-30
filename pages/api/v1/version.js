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

    response.setHeader("Cache-Control", "public, max-age=300");
    return response.status(200).json({
      tag,
      version: tag.replace(/^v/, ""),
    });
  } catch {
    return response
      .status(500)
      .json({ error: "Erro inesperado ao consultar versão" });
  }
}
