import releaseEmailTemplate from "models/releaseEmailTemplate.js";

describe("models/releaseEmailTemplate.js", () => {
  test("personalizes greeting, placeholders, supporter block, and platform link", () => {
    const result = releaseEmailTemplate.buildReleaseEmail({
      tag: "v0.6.2",
      subject: "Pindorama {{tag}} para {{username}}",
      body: "Oi **{{username}}**, saiu novidade!\n\n- Importação de `SVG`\n- Novo efeito **Glow**",
      recipient: {
        username: "Ana",
        isSupporter: true,
        deviceOs: "macOS 15",
        deviceVersion: "0.6.1",
        unsubscribeToken: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      },
      origin: "https://judhagsan.com",
      isTest: false,
    });

    expect(result.subject).toBe("Pindorama v0.6.2 para Ana");
    expect(result.html).toContain("Olá, Ana!");
    expect(result.html).toContain("Pindorama v0.6.2");
    expect(result.html).toContain("Apoiador do Pindorama");
    expect(result.html).toContain("Baixar para macOS");
    expect(result.html).toContain(
      "https://judhagsan.com/api/v1/download/macos",
    );
    expect(result.html).toContain("versão 0.6.1");
    expect(result.html).toContain("<strong");
    expect(result.html).toContain("<code");
    expect(result.html).toContain(
      "https://judhagsan.com/descadastrar/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    );
    expect(result.html).toContain(
      "faça login e remova a permissão no seu painel",
    );

    expect(result.text).toContain("Olá, Ana!");
    expect(result.text).toContain("- Importação de SVG");
    expect(result.text).toContain("Obrigado por apoiar");
    expect(result.text).toContain(
      "Ou faça login e remova a permissão no seu painel: https://judhagsan.com/sessao",
    );
    expect(result.headers["List-Unsubscribe"]).toContain(
      "https://judhagsan.com/api/v1/email-preferences/unsubscribe/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    );
    expect(result.headers["List-Unsubscribe-Post"]).toBe(
      "List-Unsubscribe=One-Click",
    );
  });

  test("escapes HTML injection and strips CRLF from subject", () => {
    const result = releaseEmailTemplate.buildReleaseEmail({
      tag: "v0.6.2\r\nBcc: evil@example.com",
      subject: "Novidade\r\nInjected: 1",
      body: 'Teste <script>alert("xss")</script> com **segurança**',
      recipient: {
        username: "<b>Hacker</b>",
        isSupporter: false,
        deviceOs: null,
        deviceVersion: null,
      },
      origin: "https://judhagsan.com",
      isTest: true,
    });

    expect(result.subject).toBe("[TESTE] Novidade Injected: 1");
    expect(result.subject).not.toMatch(/[\r\n]/);
    expect(result.html).not.toContain("<script>");
    expect(result.html).toContain("&lt;script&gt;");
    expect(result.html).toContain("&lt;b&gt;Hacker&lt;/b&gt;");
    expect(result.html).toContain("ENVIO DE TESTE");
    expect(result.html).not.toContain("Apoiador do Pindorama");
    expect(result.html).toContain("https://judhagsan.com/sessao");
  });

  test("normalizes Windows, macOS, Linux, and unknown OS names", () => {
    expect(releaseEmailTemplate.normalizePlatform("Windows 11")).toBe(
      "windows",
    );
    expect(releaseEmailTemplate.normalizePlatform("macOS 26")).toBe("macos");
    expect(releaseEmailTemplate.normalizePlatform("Ubuntu 24.04")).toBe(
      "linux",
    );
    expect(releaseEmailTemplate.normalizePlatform("FreeBSD")).toBeNull();
    expect(releaseEmailTemplate.normalizePlatform(null)).toBeNull();
  });
  test("general news uses the personalized subject as its title without Pindorama sections", () => {
    const result = releaseEmailTemplate.buildReleaseEmail({
      kind: "general",
      tag: "v0.6.2",
      subject: "Novo projeto para {{username}} & amigos",
      body: "Conheça o novo projeto que preparamos para você.",
      recipient: {
        username: "Ana",
        isSupporter: true,
        deviceOs: "Windows 11",
        deviceVersion: "0.6.1",
        unsubscribeToken: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      },
      isTest: true,
    });

    expect(result.subject).toBe("[TESTE] Novo projeto para Ana & amigos");
    expect(result.html).toMatch(
      /<h2[^>]*>Novo projeto para Ana &amp; amigos<\/h2>/,
    );
    expect(result.html).not.toContain("Pindorama");
    expect(result.html).not.toContain("/api/v1/download/");
    expect(result.text).toContain("Novo projeto para Ana & amigos");
    expect(result.text).not.toContain("Pindorama");
    expect(result.text).not.toContain("0.6.1");
    expect(result.meta.primaryActionUrl).toBeNull();
    expect(result.headers["List-Unsubscribe-Post"]).toBe(
      "List-Unsubscribe=One-Click",
    );
    expect(result.html).toContain(
      "/descadastrar/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    );
  });

  test("the window title escapes subject HTML and interpolates release details", () => {
    const result = releaseEmailTemplate.buildReleaseEmail({
      tag: "v0.7.0",
      subject: "<img src=x onerror=alert(1)> {{tag}} para {{username}}",
      body: "Mensagem de novidades.",
      recipient: { username: "Ana" },
    });
    expect(result.html).toMatch(
      /<h2[^>]*>&lt;img src=x onerror=alert\(1\)&gt; v0.7.0 para Ana<\/h2>/,
    );
    expect(result.html).not.toContain("<img src=x");
    expect(result.html).toContain("Acessar download no site");
  });
});
