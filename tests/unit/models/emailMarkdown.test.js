import { renderEmailMarkdown, emailUrl } from "models/emailMarkdown.js";

describe("email Markdown", () => {
  test("renders headings, nested lists, quotes, tables, inline styles and code", () => {
    const result = renderEmailMarkdown(
      '# Título\n\n**forte**, *ênfase* e ~~antigo~~.\n\n1. Primeiro\n   - Subitem\n2. Segundo\n\n> Citação\n\n| Nome | Valor |\n| :--- | ---: |\n| A | 10 |\n\n---\n\n```js\nconst a = "<script>";\n```',
    );
    for (const tag of [
      "h1",
      "strong",
      "em",
      "s",
      "ol",
      "ul",
      "blockquote",
      "table",
      "th",
      "pre",
    ])
      expect(result.html).toContain(`<${tag}`);
    expect(result.html).toContain('scope="col"');
    expect(result.html).toContain("text-align:right");
    expect(result.html).toContain("&lt;script&gt;");
    expect(result.text).toContain("1. Primeiro");
    expect(result.text).toContain("  - Subitem");
    expect(result.text).toContain("2. Segundo");
    expect(result.text).toContain("Nome | Valor");
    expect(result.text).not.toContain("**forte**");
  });
  test("renders linked GIFs, reference links, autolinks, and relative media URLs in both alternatives", () => {
    const result = renderEmailMarkdown(
      "[![Animação](/api/v1/releases/media/teste)](https://example.com)\n\n[Projeto][p]\n\n[p]: https://example.com/projeto\n\nhttps://example.com/novidades",
      { origin: "https://judhagsan.com" },
    );
    expect(result.html).toContain('href="https://example.com/"');
    expect(result.html).toContain(
      'src="https://judhagsan.com/api/v1/releases/media/teste"',
    );
    expect(result.html).toContain('alt="Animação"');
    expect(result.html).toContain("max-width:508px");
    expect(result.html).toContain('href="https://example.com/projeto"');
    expect(result.html).toContain('href="https://example.com/novidades"');
    expect(result.text).toContain(
      "Animação (https://judhagsan.com/api/v1/releases/media/teste)",
    );
    expect(result.text).toContain("Projeto (https://example.com/projeto)");
  });
  test("keeps personalization literal, including Markdown and HTML punctuation", () => {
    const result = renderEmailMarkdown(
      "## Olá, {{username}}!\n\n**{{tag}}** e `{{username}}`",
      {
        variables: {
          username: "[X](https://evil.test) <img src=x>",
          tag: "**v1**",
        },
      },
    );
    expect(result.html).toContain("[X](https://evil.test) &lt;img src=x&gt;");
    expect(result.html).not.toContain('href="https://evil.test"');
    expect(result.html).not.toContain("<img");
    expect(result.text).toContain("**v1**");
  });
  test.each([
    "javascript:alert(1)",
    "java&#115;cript:alert(1)",
    "data:image/svg+xml;base64,PHN2Zz4=",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
  ])("rejects executable or local addresses: %s", (address) => {
    const result = renderEmailMarkdown(
      `[link](${address}) ![imagem](${address})`,
    );
    expect(result.html).not.toMatch(/<(?:a|img)\s/);
  });
  test("escapes raw HTML and rejects image-only unsafe schemes", () => {
    const result = renderEmailMarkdown(
      "<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n![alt](mailto:x@example.com)\n\n[Email](mailto:x@example.com)",
    );
    expect(result.html).not.toContain("<script>");
    expect(result.html).not.toContain("<img");
    expect(result.html).toContain("&lt;img");
    expect(result.html).toContain('href="mailto:x@example.com"');
    expect(emailUrl("https://user:password@example.com")).toBeNull();
    expect(emailUrl("https://example.com\n")).toBe("https://example.com/");
    expect(emailUrl("https://exa\nmple.com")).toBeNull();
  });
});
