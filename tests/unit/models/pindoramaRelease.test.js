import pindoramaRelease from "models/pindoramaRelease.js";

// A seleção da build de PR é a regra que decide se o botão "build de teste"
// aparece no Pindorama e qual build ele instala. Errar aqui tem duas caras
// ruins: prometer uma build que não existe mais (o release é apagado quando o
// PR fecha) ou oferecer uma antiga quando há uma mais nova.

function release(overrides = {}) {
  return {
    tag_name: "pr-1",
    prerelease: true,
    draft: false,
    published_at: "2026-08-01T00:00:00Z",
    assets: [],
    ...overrides,
  };
}

describe("selectLatestPrerelease", () => {
  test("sem releases devolve null", () => {
    expect(pindoramaRelease.selectLatestPrerelease([])).toBeNull();
    expect(pindoramaRelease.selectLatestPrerelease(null)).toBeNull();
    expect(pindoramaRelease.selectLatestPrerelease(undefined)).toBeNull();
  });

  test("ignora releases estáveis", () => {
    // O canal de build de PR nunca deve oferecer o release público: quem quer
    // esse já tem o botão de update normal.
    const releases = [
      release({ tag_name: "v0.5.6", prerelease: false }),
      release({ tag_name: "v0.5.5", prerelease: false }),
    ];
    expect(pindoramaRelease.selectLatestPrerelease(releases)).toBeNull();
  });

  test("ignora prerelease que não veio de PR", () => {
    // Uma beta publicada à mão (tag `v0.6.0-beta1`) é prerelease, mas não é
    // build de PR — e o download resolveria o asset errado.
    const releases = [release({ tag_name: "v0.6.0-beta1" })];
    expect(pindoramaRelease.selectLatestPrerelease(releases)).toBeNull();
  });

  test("ignora rascunho", () => {
    // Draft não tem asset publicado: apareceria como build disponível e o
    // download falharia na cara de quem clicou.
    const releases = [release({ tag_name: "pr-42", draft: true })];
    expect(pindoramaRelease.selectLatestPrerelease(releases)).toBeNull();
  });

  test("escolhe a build publicada mais recente", () => {
    const releases = [
      release({ tag_name: "pr-10", published_at: "2026-08-01T10:00:00Z" }),
      release({ tag_name: "pr-42", published_at: "2026-08-20T10:00:00Z" }),
      release({ tag_name: "pr-7", published_at: "2026-07-01T10:00:00Z" }),
    ];
    expect(pindoramaRelease.selectLatestPrerelease(releases).tag_name).toBe(
      "pr-42",
    );
  });

  test("ordena por publicação, não pela ordem da resposta", () => {
    // A API devolve por data de CRIAÇÃO; um release criado antes pode ter sido
    // publicado depois (build refeita num push novo com a label já presente).
    const releases = [
      release({
        tag_name: "pr-10",
        created_at: "2026-08-25T00:00:00Z",
        published_at: "2026-08-01T00:00:00Z",
      }),
      release({
        tag_name: "pr-11",
        created_at: "2026-08-02T00:00:00Z",
        published_at: "2026-08-26T00:00:00Z",
      }),
    ];
    expect(pindoramaRelease.selectLatestPrerelease(releases).tag_name).toBe(
      "pr-11",
    );
  });

  test("cai para created_at quando não há published_at", () => {
    const releases = [
      release({
        tag_name: "pr-1",
        published_at: null,
        created_at: "2026-08-01T00:00:00Z",
      }),
      release({
        tag_name: "pr-2",
        published_at: null,
        created_at: "2026-08-20T00:00:00Z",
      }),
    ];
    expect(pindoramaRelease.selectLatestPrerelease(releases).tag_name).toBe(
      "pr-2",
    );
  });
});

describe("prNumberFromTag", () => {
  test("extrai o número do PR", () => {
    expect(pindoramaRelease.prNumberFromTag("pr-42")).toBe(42);
    expect(pindoramaRelease.prNumberFromTag("pr-1")).toBe(1);
  });

  test("devolve null para tag fora do formato", () => {
    // Não é erro: só não temos número para exibir no botão.
    expect(pindoramaRelease.prNumberFromTag("v0.5.6")).toBeNull();
    expect(pindoramaRelease.prNumberFromTag("pr-")).toBeNull();
    expect(pindoramaRelease.prNumberFromTag("pr-abc")).toBeNull();
    expect(pindoramaRelease.prNumberFromTag(null)).toBeNull();
    expect(pindoramaRelease.prNumberFromTag(undefined)).toBeNull();
  });
});

describe("FILES", () => {
  test("cobre as três plataformas com os nomes que os workflows publicam", () => {
    // Se um workflow mudar o nome do artefato e este mapa não acompanhar, o
    // download devolve 404 só naquela plataforma — o tipo de quebra que passa
    // despercebida até alguém tentar baixar.
    expect(pindoramaRelease.FILES).toEqual({
      windows: "Pindorama-Setup.exe",
      macos: "Pindorama-macOS-arm64.dmg",
      linux: "Pindorama-x86_64.AppImage",
    });
  });
});
