import MarkdownIt from "markdown-it";

const markdown = new MarkdownIt({ html: false, linkify: true, breaks: true });
const escape = markdown.utils.escapeHtml;

// Links relativos à raiz são úteis para arquivos enviados pelo editor.
// O HTML final sempre contém URLs absolutas, inclusive fora do site.
export function emailUrl(
  value,
  origin = "https://judhagsan.com",
  image = false,
) {
  const raw = String(value || "").trim();
  if (
    !raw ||
    Array.from(raw).some(
      (character) =>
        character.charCodeAt(0) <= 32 || character.charCodeAt(0) === 127,
    )
  )
    return null;
  if (!/^(https?:\/\/|mailto:|tel:|\/)/i.test(raw)) return null;
  try {
    const url = new URL(raw, origin);
    const allowed = image
      ? ["https:", "http:"]
      : ["https:", "http:", "mailto:", "tel:"];
    if (!allowed.includes(url.protocol) || url.username || url.password)
      return null;
    return url.href;
  } catch {
    return null;
  }
}

markdown.validateLink = (url) => Boolean(emailUrl(url));

const styles = {
  paragraph_open:
    "margin:0 0 16px;color:#d4d4d8;font-size:15px;line-height:1.65;overflow-wrap:break-word;word-wrap:break-word;",
  bullet_list_open: "margin:0 0 18px;padding-left:24px;color:#d4d4d8;",
  ordered_list_open: "margin:0 0 18px;padding-left:24px;color:#d4d4d8;",
  list_item_open: "margin:0 0 8px;font-size:15px;line-height:1.65;",
  blockquote_open:
    "margin:16px 0;padding:12px 16px;border-left:3px solid #ffbf00;background-color:#18181b;color:#d4d4d8;",
  strong_open: "color:#fffffe;font-weight:700;",
  em_open: "font-style:italic;",
  s_open: "text-decoration:line-through;",
  table_open:
    "width:100%;table-layout:fixed;border-collapse:collapse;margin:16px 0;color:#d4d4d8;font-size:13px;line-height:1.5;",
};
for (const [type, style] of Object.entries(styles)) {
  markdown.renderer.rules[type] = (tokens, index, options, _env, self) => {
    tokens[index].attrSet("style", style);
    if (type === "table_open") {
      tokens[index].attrSet("width", "100%");
      tokens[index].attrSet("cellpadding", "0");
      tokens[index].attrSet("cellspacing", "0");
    }
    return self.renderToken(tokens, index, options);
  };
}
markdown.renderer.rules.heading_open = (tokens, index, options, _env, self) => {
  const size = [24, 21, 18, 16, 15, 14][Number(tokens[index].tag.slice(1)) - 1];
  tokens[index].attrSet(
    "style",
    `margin:22px 0 12px;color:#fffffe;font-size:${size}px;line-height:1.35;font-weight:800;overflow-wrap:break-word;`,
  );
  return self.renderToken(tokens, index, options);
};
for (const type of ["th_open", "td_open"]) {
  markdown.renderer.rules[type] = (tokens, index, options, _env, self) => {
    const token = tokens[index];
    const alignment = token.attrGet("style") || "text-align:left";
    token.attrSet(
      "style",
      `${alignment};padding:10px 8px;border:1px solid #52525b;vertical-align:top;overflow-wrap:anywhere;word-break:break-word;${type === "th_open" ? "background-color:#27272a;color:#fffffe;font-weight:700;" : ""}`,
    );
    if (type === "th_open") token.attrSet("scope", "col");
    return self.renderToken(tokens, index, options);
  };
}
markdown.renderer.rules.link_open = (tokens, index, options, _env, self) => {
  tokens[index].attrSet(
    "style",
    "color:#ffcf40;text-decoration:underline;overflow-wrap:anywhere;word-break:break-word;",
  );
  tokens[index].attrSet("target", "_blank");
  tokens[index].attrSet("rel", "noopener noreferrer");
  return self.renderToken(tokens, index, options);
};
markdown.renderer.rules.image = (tokens, index, _options, _env, self) => {
  const token = tokens[index];
  const alt = self.renderInlineAsText(token.children || []);
  const src = token.attrGet("src");
  if (!src) return escape(alt);
  const title = token.attrGet("title");
  return `<img src="${escape(src)}" alt="${escape(alt)}"${title ? ` title="${escape(title)}"` : ""} width="508" border="0" style="display:block;width:100%;max-width:508px;height:auto;margin:16px auto;border:0;border-radius:8px;color:#d4d4d8;" />`;
};
markdown.renderer.rules.code_inline = (tokens, index) =>
  `<code style="background-color:#1c1c22;border:1px solid #2e2e38;border-radius:4px;padding:1px 5px;color:#fffffe;font-family:monospace;font-size:13px;overflow-wrap:anywhere;">${escape(tokens[index].content)}</code>`;
const codeBlock = (tokens, index) =>
  `<pre style="margin:16px 0;padding:16px;background-color:#18181b;border:1px solid #3f3f46;border-radius:8px;color:#e4e4e7;font-size:13px;line-height:1.6;white-space:pre-wrap;word-wrap:break-word;overflow-wrap:anywhere;"><code style="font-family:monospace;">${escape(tokens[index].content)}</code></pre>`;
markdown.renderer.rules.fence = codeBlock;
markdown.renderer.rules.code_block = codeBlock;
markdown.renderer.rules.hr = () =>
  '<hr style="border:0;border-top:1px solid #52525b;margin:24px 0;" />';

function personalize(tokens, variables, origin) {
  const replace = (text) =>
    String(text || "").replace(
      /\{\{\s*(username|tag)\s*\}\}/gi,
      (_match, key) => String(variables[key.toLowerCase()] ?? ""),
    );
  for (const token of tokens) {
    token.content = replace(token.content);
    if (token.children) personalize(token.children, variables, origin);
    const title = token.attrGet("title");
    if (title) token.attrSet("title", replace(title));
    if (token.type === "link_open" || token.type === "image") {
      const attribute = token.type === "image" ? "src" : "href";
      const value = emailUrl(
        replace(token.attrGet(attribute)),
        origin,
        token.type === "image",
      );
      // Um endereço inválido nunca chega ao HTML, mesmo vindo de uma variável.
      token.attrSet(attribute, value || "");
    }
  }
}

function plainText(tokens) {
  let text = "";
  const lists = [];
  const links = [];
  for (const token of tokens) {
    switch (token.type) {
      case "inline":
        text += plainText(token.children || []);
        break;
      case "text":
      case "code_inline":
        text += token.content;
        break;
      case "fence":
      case "code_block":
        text += `\n${token.content}\n`;
        break;
      case "image": {
        const alt = plainText(token.children || []);
        const src = token.attrGet("src");
        text += src ? `${alt || "Imagem"} (${src})` : alt;
        break;
      }
      case "link_open":
        links.push(token.attrGet("href"));
        break;
      case "link_close": {
        const href = links.pop();
        if (href) text += ` (${href})`;
        break;
      }
      case "softbreak":
      case "hardbreak":
        text += "\n";
        break;
      case "bullet_list_open":
        lists.push({ ordered: false });
        break;
      case "ordered_list_open":
        lists.push({
          ordered: true,
          next: Number(token.attrGet("start") || 1),
        });
        break;
      case "bullet_list_close":
      case "ordered_list_close":
        lists.pop();
        text += "\n";
        break;
      case "list_item_open": {
        const list = lists.at(-1);
        text += `\n${"  ".repeat(Math.max(0, lists.length - 1))}${list?.ordered ? `${list.next++}.` : "-"} `;
        break;
      }
      case "paragraph_close":
        if (!token.hidden) text += "\n\n";
        break;
      case "heading_close":
      case "blockquote_close":
      case "table_close":
        text += "\n\n";
        break;
      case "blockquote_open":
        text += "\n> ";
        break;
      case "th_close":
      case "td_close":
        text += " | ";
        break;
      case "tr_close":
        text = text.replace(/ \| $/, "") + "\n";
        break;
      case "hr":
        text += "\n---\n";
        break;
      default:
        break;
    }
  }
  return text;
}

export function renderEmailMarkdown(
  body,
  { origin = "https://judhagsan.com", variables = {} } = {},
) {
  // A substituição após a análise mantém nomes e versões como texto literal,
  // sem permitir que os dados do destinatário criem links ou formatação.
  const tokens = markdown.parse(String(body || "").replace(/\r\n?/g, "\n"), {});
  personalize(tokens, variables, origin);
  return {
    html: markdown.renderer.render(tokens, markdown.options, {}),
    text: plainText(tokens)
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
  };
}
