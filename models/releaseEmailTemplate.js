import { renderEmailMarkdown } from "./emailMarkdown.js";

/*
 * Template isomórfico dos e-mails de novidades gerais e versões do Pindorama.
 *
 * Mantido em JavaScript puro (sem módulos do Node) para ser importado tanto
 * pelo backend no envio real quanto pelo card administrativo na prévia ao
 * vivo — assim o que aparece na prévia é exatamente o que vai na caixa de
 * entrada.
 */

const PLATFORM_LABELS = {
  windows: "Windows",
  macos: "macOS",
  linux: "Linux",
};

function sanitizeHeaderValue(value) {
  return String(value || "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizePlatform(osString) {
  if (!osString) return null;
  const normalized = String(osString).toLowerCase();
  if (normalized.includes("win")) return "windows";
  if (
    normalized.includes("mac") ||
    normalized.includes("darwin") ||
    normalized.includes("os x")
  ) {
    return "macos";
  }
  if (
    normalized.includes("linux") ||
    normalized.includes("ubuntu") ||
    normalized.includes("fedora") ||
    normalized.includes("arch") ||
    normalized.includes("debian")
  ) {
    return "linux";
  }
  return null;
}

function normalizeVersionNumber(version) {
  return String(version || "")
    .trim()
    .replace(/^v/i, "");
}

function interpolatePlaceholders(text, { username, tag }) {
  const safeUsername = String(username || "animador");
  const safeTag = String(tag || "").trim();

  return String(text || "")
    .replace(/\{\{\s*username\s*\}\}/gi, safeUsername)
    .replace(/\{\{\s*tag\s*\}\}/gi, safeTag);
}

// A moldura do CardNormal adaptada a tabelas e estilos inline. Somente o
// conteúdo das janelas muda; a prévia e o envio usam este mesmo HTML.
// Controles como no site: círculos de 20px, intervalo de 10px e borda de
// 2px no primeiro. Formas com medidas fixas, sem depender de glifos da fonte.
// bodyHtml é composto abaixo a partir de conteúdo já escapado.
function renderEmailWindow(title, bodyHtml, { accent = false } = {}) {
  const frameColor = accent ? "#ffbf00" : "#fffffe";
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0b0b0f" style="width:100%;table-layout:fixed;border-collapse:separate;border-spacing:0;border:2px solid ${frameColor};border-radius:16px;background-color:#0b0b0f;">
      <tr>
        <td bgcolor="${frameColor}" style="padding:9px 14px;background-color:${frameColor};border-radius:13px 13px 0 0;border-bottom:2px solid #0b0b0f;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;table-layout:fixed;">
            <tr>
              <td width="80" valign="middle" aria-hidden="true" style="width:80px;">
                <table role="presentation" width="80" cellpadding="0" cellspacing="0" border="0" style="width:80px;border-collapse:collapse;table-layout:fixed;">
                  <tr>
                    <td width="20" style="width:20px;padding:0;"><span style="display:block;width:16px;height:16px;border:2px solid #000000;border-radius:50%;background-color:${frameColor};font-size:0;line-height:0;">&nbsp;</span></td>
                    <td width="10" style="width:10px;padding:0;font-size:0;line-height:0;">&nbsp;</td>
                    <td width="20" style="width:20px;padding:0;"><span style="display:block;width:20px;height:20px;border-radius:50%;background-color:#000000;font-size:0;line-height:0;">&nbsp;</span></td>
                    <td width="10" style="width:10px;padding:0;font-size:0;line-height:0;">&nbsp;</td>
                    <td width="20" style="width:20px;padding:0;"><span style="display:block;width:20px;height:20px;border-radius:50%;background-color:#000000;font-size:0;line-height:0;">&nbsp;</span></td>
                  </tr>
                </table>
              </td>
              <td align="center" valign="middle" style="padding:0 6px;color:#0b0b0f;overflow-wrap:break-word;">
                <h2 style="margin:0;color:#0b0b0f;font-size:13px;line-height:1.4;font-weight:800;letter-spacing:0.7px;text-transform:uppercase;">${escapeHtml(title)}</h2>
              </td>
              <td width="80" aria-hidden="true" style="width:80px;font-size:0;line-height:0;">&nbsp;</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td class="window-body" style="padding:24px;color:#fffffe;overflow-wrap:break-word;word-wrap:break-word;">
          ${bodyHtml}
        </td>
      </tr>
    </table>`;
}

// A mesma perspectiva da home, desenhada pelo cliente de email em CSS.
// Cada camada usa percentuais da célula inteira: sua altura vem do conteúdo,
// inclusive após quebra de linhas no celular. Não há bitmap, altura estimada,
// repetição de imagem nem JavaScript no email enviado.
function buildPerspectiveGridStyle() {
  const layers = [];
  const sizes = [];
  const addLayer = (gradient, size) => {
    layers.push(gradient);
    sizes.push(size);
  };
  // Uma transição de meio pixel em cada borda suaviza o serrilhado dos
  // gradientes sem desfocar o núcleo do traço. A cobertura total preserva
  // as espessuras de 1,5px e 2px, mesmo com posições percentuais fracionárias.
  const line = (direction, color = "#3f3f46", width = 1.5) => {
    const outer = width / 2 + 0.25;
    const inner = width / 2 - 0.25;
    return `linear-gradient(${direction},transparent calc(50% - ${outer}px),${color} calc(50% - ${inner}px),${color} calc(50% + ${inner}px),transparent calc(50% + ${outer}px))`;
  };
  const edges = (direction) =>
    `linear-gradient(${direction},transparent 0px,#3f3f46 0.5px,#3f3f46 1.5px,transparent 2px,transparent calc(100% - 2px),#3f3f46 calc(100% - 1.5px),#3f3f46 calc(100% - 0.5px),transparent 100%)`;

  // Os raios opostos formam uma única diagonal centralizada. As direções
  // por canto preservam a geometria quando a proporção do email muda.
  addLayer(line("to top right", "#52525b", 2), "100% 100%");
  addLayer(line("to bottom right", "#52525b", 2), "100% 100%");
  for (let i = 1; i <= 7; i++) {
    const span = Math.abs(100 - (200 * i) / 8);
    if (span === 0) {
      addLayer(line("90deg"), "100% 100%");
      addLayer(line("0deg"), "100% 100%");
    } else {
      const direction = i < 4 ? "to top right" : "to bottom right";
      addLayer(line(direction), `${span}% 100%`);
      addLayer(line(direction), `100% ${span}%`);
    }
  }

  // Escala de profundidade igual à PerspectiveGrid da home. Os retângulos
  // minúsculos no ponto de fuga são omitidos para evitar acúmulo de traços.
  for (let i = 1; i < 29; i++) {
    const size = Number((Math.pow(i / 29, 2.3) * 100).toFixed(3));
    if (size < 0.5) continue;
    addLayer(edges("90deg"), `${size}% ${size}%`);
    addLayer(edges("0deg"), `${size}% ${size}%`);
  }

  return `background-color:#0b0b0f;background-image:${layers.join(",")};background-size:${sizes.join(",")};background-position:center;background-repeat:no-repeat;`;
}

const PERSPECTIVE_GRID_STYLE = buildPerspectiveGridStyle();

function buildReleaseEmail({
  kind = "pindorama",
  tag = "",
  subject = "",
  body = "",
  recipient = {},
  origin = "https://judhagsan.com",
  isTest = false,
}) {
  const cleanOrigin = String(origin || "https://judhagsan.com").replace(
    /\/+$/,
    "",
  );
  const isPindorama = kind === "pindorama";
  const cleanTag = isPindorama ? sanitizeHeaderValue(tag) : "";
  const username = String(recipient.username || "animador").trim();
  const isSupporter = isPindorama && Boolean(recipient.isSupporter);
  const platform = isPindorama ? normalizePlatform(recipient.deviceOs) : null;
  const platformLabel = platform ? PLATFORM_LABELS[platform] : null;
  const deviceVersion = normalizeVersionNumber(recipient.deviceVersion);
  const targetVersion = normalizeVersionNumber(cleanTag);
  const hasOlderVersion =
    Boolean(deviceVersion) &&
    Boolean(targetVersion) &&
    deviceVersion !== targetVersion;

  const interpolatedSubject = sanitizeHeaderValue(
    interpolatePlaceholders(subject, { username, tag: cleanTag }),
  );
  const finalSubject = isTest
    ? `[TESTE] ${interpolatedSubject}`
    : interpolatedSubject;

  const renderedBody = renderEmailMarkdown(body, {
    origin: cleanOrigin,
    variables: { username, tag: cleanTag },
  });

  const sessionUrl = `${cleanOrigin}/sessao`;
  const primaryActionUrl = !isPindorama
    ? null
    : platform
      ? `${cleanOrigin}/api/v1/download/${platform}`
      : sessionUrl;
  const primaryActionLabel = platformLabel
    ? `Baixar para ${platformLabel}`
    : "Acessar download no site";

  const unsubscribeUrl = recipient.unsubscribeToken
    ? `${cleanOrigin}/descadastrar/${recipient.unsubscribeToken}`
    : `${cleanOrigin}/sessao`;
  const oneClickUnsubscribeUrl = recipient.unsubscribeToken
    ? `${cleanOrigin}/api/v1/email-preferences/unsubscribe/${recipient.unsubscribeToken}`
    : null;

  const versionHintText = hasOlderVersion
    ? `Vimos que seu Pindorama estava na versão ${deviceVersion}. Você pode atualizar direto pelo aplicativo ou baixar o instalador abaixo.`
    : platformLabel
      ? `Você pode atualizar direto pelo Pindorama ou baixar o instalador de ${platformLabel} abaixo.`
      : "Você pode atualizar direto pelo Pindorama ou baixar a nova versão na sua conta.";

  const logoUrl = `${cleanOrigin}/email/judhagsan-logo.png`;
  const windowSpacer =
    '<tr><td height="20" style="height:20px;font-size:0;line-height:0;">&nbsp;</td></tr>';

  const newsWindow = renderEmailWindow(
    interpolatedSubject || "Novidades",
    `
      <h1 style="margin:0 0 24px 0;font-size:26px;line-height:1.25;font-weight:800;letter-spacing:-0.5px;color:#fffffe;">Olá, ${escapeHtml(username)}!</h1>
      ${renderedBody.html}
    `,
  );

  const downloadWindow = renderEmailWindow(
    "Download",
    `
      <p style="margin:0 0 20px 0;color:#d4d4d8;font-size:14px;line-height:1.65;">${escapeHtml(versionHintText)}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;border-spacing:0;">
        <tr>
          <td align="center" bgcolor="#fffffe" style="border:2px solid #fffffe;border-radius:999px;background-color:#fffffe;mso-padding-alt:14px 16px;">
            <a href="${escapeHtml(primaryActionUrl)}" style="display:block;padding:14px 16px;color:#0b0b0f;text-decoration:none;font-size:13px;line-height:1.4;font-weight:800;text-transform:uppercase;letter-spacing:0.7px;">${escapeHtml(primaryActionLabel)}</a>
          </td>
        </tr>
      </table>
      ${
        platform
          ? `<p style="margin:16px 0 0 0;text-align:center;font-size:12px;line-height:1.6;"><a href="${escapeHtml(sessionUrl)}" style="color:#fffffe;text-decoration:underline;text-underline-offset:3px;">Outras plataformas</a></p>`
          : ""
      }
    `,
  );

  const supporterWindow = isSupporter
    ? `${windowSpacer}<tr><td>${renderEmailWindow(
        "Apoiador do Pindorama",
        '<p style="margin:0;color:#d4d4d8;font-size:14px;line-height:1.65;">Muito obrigado por apoiar o desenvolvimento do Pindorama. Cada nova versão sai do papel graças ao seu apoio.</p>',
        { accent: true },
      )}</td></tr>`
    : "";

  const testBannerHtml = isTest
    ? `<tr><td style="padding:0 0 20px 0;"><p style="margin:0;padding:12px 16px;border:1px solid #fffffe;border-radius:12px;background-color:#0b0b0f;color:#d4d4d8;font-size:12px;line-height:1.6;text-align:center;"><strong style="color:#fffffe;letter-spacing:0.7px;">ENVIO DE TESTE</strong><br />Conferência antes do disparo para a base.</p></td></tr>`
    : "";

  // O fundo procedural acompanha a célula de altura automática na prévia
  // e no envio. Estilos inline sobrevivem a leitores que removem <style>.
  // Leitores sem suporte a gradientes mantêm o fundo sólido e legível.
  // https://developers.google.com/workspace/gmail/design/css
  const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="dark" />
    <meta name="supported-color-schemes" content="dark" />
    <title>${escapeHtml(finalSubject)}</title>
    <style>
      @media screen and (max-width:480px) {
        .email-desktop { padding:24px 12px !important; }
        .window-body { padding:20px 16px !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background-color:#0b0b0f;color:#fffffe;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0b0b0f" style="width:100%;border-collapse:collapse;background-color:#0b0b0f;">
      <tr>
        <td class="email-desktop" align="center" valign="top" style="padding:32px 28px 40px;${PERSPECTIVE_GRID_STYLE}">
          <!--[if mso]><table role="presentation" width="560" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;border-collapse:collapse;">
            <tr>
              <td align="center" style="padding:0 0 28px 0;">
                <a href="${escapeHtml(cleanOrigin)}" style="display:inline-block;padding:10px 18px;color:#fffffe;text-decoration:none;">
                  <img src="${escapeHtml(logoUrl)}" width="168" height="36" alt="JUDHAGSAN" border="0" style="display:block;width:168px;height:36px;max-width:100%;border:0;color:#fffffe;font-size:20px;font-weight:800;letter-spacing:1px;" />
                </a>
              </td>
            </tr>
            ${testBannerHtml}
            <tr><td>${newsWindow}</td></tr>
            ${isPindorama ? `${windowSpacer}<tr><td>${downloadWindow}</td></tr>` : ""}
            ${supporterWindow}
            ${windowSpacer}
            <tr>
              <td style="padding:16px 18px;background-color:#0b0b0f;border:1px solid #3f3f46;border-radius:12px;color:#a1a1aa;font-size:12px;line-height:1.7;">
                <p style="margin:0 0 8px 0;">
                  Você recebeu este e-mail porque possui conta ativa em <a href="${escapeHtml(cleanOrigin)}" style="color:#fffffe;text-decoration:underline;">judhagsan.com</a>.
                </p>
                <p style="margin:0;">
                  Não quer mais receber novidades por email?
                  <a href="${escapeHtml(unsubscribeUrl)}" style="color:#fffffe;text-decoration:underline;">Cancelar emails de novidades</a>
                  ou <a href="${escapeHtml(sessionUrl)}" style="color:#fffffe;text-decoration:underline;">faça login e remova a permissão no seu painel</a>.
                </p>
              </td>
            </tr>
          </table>
          <!--[if mso]></td></tr></table><![endif]-->
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const textParts = [];
  if (isTest) {
    textParts.push("[ENVIO DE TESTE — conferência antes do disparo]");
  }
  textParts.push(`${interpolatedSubject || "Novidades"}\n\nOlá, ${username}!`);
  const renderedTextBody = renderedBody.text;
  if (renderedTextBody) {
    textParts.push(renderedTextBody);
  }
  if (isSupporter) {
    textParts.push(
      "Obrigado por apoiar o desenvolvimento do Pindorama! Cada nova versão sai do papel graças ao seu apoio.",
    );
  }
  if (isPindorama) {
    textParts.push(
      `${versionHintText}\n${primaryActionLabel}: ${primaryActionUrl}${platform ? `\nOutras plataformas: ${sessionUrl}` : ""}`,
    );
  }
  textParts.push(
    `Atenciosamente,\nEquipe Judhagsan\n\n---\nCancelar emails de novidades: ${unsubscribeUrl}\nOu faça login e remova a permissão no seu painel: ${sessionUrl}`,
  );

  const headers = {};
  if (oneClickUnsubscribeUrl) {
    headers["List-Unsubscribe"] =
      `<${oneClickUnsubscribeUrl}>, <mailto:contato@judhagsan.com?subject=Descadastrar%20releases>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }

  return {
    subject: finalSubject,
    html,
    text: textParts.join("\n\n"),
    headers,
    meta: {
      platform,
      platformLabel,
      isSupporter,
      hasOlderVersion,
      primaryActionUrl,
      unsubscribeUrl,
    },
  };
}

const releaseEmailTemplate = {
  buildReleaseEmail,
  escapeHtml,
  interpolatePlaceholders,
  normalizePlatform,
  sanitizeHeaderValue,
};

export default releaseEmailTemplate;
