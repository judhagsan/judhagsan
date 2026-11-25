/*
 * Template isomórfico dos e-mails de aviso de release do Pindorama.
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

// Formatação inline mínima aplicada APÓS escapeHtml: apenas **negrito** e
// `código`, impedindo qualquer HTML arbitrário no corpo do e-mail.
function formatInlineHtml(text) {
  return escapeHtml(text)
    .replace(
      /\*\*([^*\n]+)\*\*/g,
      '<strong style="color:#fffffe;font-weight:700;">$1</strong>',
    )
    .replace(
      /`([^`\n]+)`/g,
      '<code style="background:#1c1c22;border:1px solid #2e2e38;border-radius:4px;padding:1px 5px;color:#fffffe;font-size:13px;">$1</code>',
    );
}

function stripSimpleMarkdown(text) {
  return String(text || "")
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/`([^`\n]+)`/g, "$1");
}

function parseBodyBlocks(rawBody) {
  const normalized = String(rawBody || "")
    .replace(/\r\n/g, "\n")
    .trim();
  if (!normalized) return [];

  const blocks = [];
  const chunks = normalized.split(/\n{2,}/);

  for (const chunk of chunks) {
    const lines = chunk
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) continue;

    const isList = lines.every((line) => /^[-*•]\s+/.test(line));
    if (isList) {
      blocks.push({
        type: "list",
        items: lines.map((line) => line.replace(/^[-*•]\s+/, "")),
      });
    } else {
      blocks.push({
        type: "paragraph",
        lines,
      });
    }
  }

  return blocks;
}

function renderBlocksToHtml(blocks) {
  return blocks
    .map((block) => {
      if (block.type === "list") {
        const itemsHtml = block.items
          .map(
            (item) =>
              `<li style="margin:0 0 8px 0;color:#d4d4d8;font-size:15px;line-height:1.6;">${formatInlineHtml(item)}</li>`,
          )
          .join("");
        return `<ul style="margin:0 0 18px 0;padding-left:20px;">${itemsHtml}</ul>`;
      }

      const content = block.lines.map(formatInlineHtml).join("<br />");
      return `<p style="margin:0 0 16px 0;color:#d4d4d8;font-size:15px;line-height:1.65;">${content}</p>`;
    })
    .join("");
}

function renderBlocksToText(blocks) {
  return blocks
    .map((block) => {
      if (block.type === "list") {
        return block.items
          .map((item) => `- ${stripSimpleMarkdown(item)}`)
          .join("\n");
      }
      return block.lines.map(stripSimpleMarkdown).join("\n");
    })
    .join("\n\n");
}

function buildReleaseEmail({
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
  const cleanTag = sanitizeHeaderValue(tag);
  const username = String(recipient.username || "animador").trim();
  const isSupporter = Boolean(recipient.isSupporter);
  const platform = normalizePlatform(recipient.deviceOs);
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

  const interpolatedBody = interpolatePlaceholders(body, {
    username,
    tag: cleanTag,
  });
  const blocks = parseBodyBlocks(interpolatedBody);

  const sessionUrl = `${cleanOrigin}/sessao`;
  const primaryActionUrl = platform
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

  const supporterHtml = isSupporter
    ? `
      <tr>
        <td style="padding:0 28px 20px 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;background:#1a1608;border:1px solid #fbbf24;border-radius:10px;">
            <tr>
              <td style="padding:14px 16px;color:#fde68a;font-size:13px;line-height:1.55;">
                <strong style="color:#fbbf24;text-transform:uppercase;letter-spacing:0.8px;font-size:11px;display:block;margin-bottom:4px;">Apoiador do Pindorama</strong>
                Muito obrigado por apoiar o desenvolvimento do Pindorama. Cada nova versão sai do papel graças ao seu apoio.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `
    : "";

  const tagPillHtml = cleanTag
    ? `<span style="display:inline-block;padding:4px 10px;border:1px solid #3f3f46;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#fffffe;background:#18181f;margin-bottom:14px;">Pindorama ${escapeHtml(cleanTag)}</span>`
    : `<span style="display:inline-block;padding:4px 10px;border:1px solid #3f3f46;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#fffffe;background:#18181f;margin-bottom:14px;">Pindorama</span>`;

  const testBannerHtml = isTest
    ? `
      <tr>
        <td style="padding:12px 28px;background:#18181f;border-bottom:1px solid #27272a;color:#a1a1aa;font-size:12px;letter-spacing:0.4px;">
          <strong style="color:#fffffe;">ENVIO DE TESTE</strong> · Conferência antes do disparo para a base.
        </td>
      </tr>
    `
    : "";

  // Cores quase-puras (#0b0b0f / #fffffe) evitam inversão agressiva de dark
  // mode no Apple Mail (mesma regra aplicada em assinatura-email.html).
  const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(finalSubject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#0b0b0f;color:#fffffe;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;background:#0b0b0f;">
      <tr>
        <td align="center" style="padding:28px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;border-collapse:collapse;background:#121217;border:1px solid #27272a;border-radius:14px;overflow:hidden;">
            ${testBannerHtml}
            <tr>
              <td style="padding:28px 28px 8px 28px;">
                ${tagPillHtml}
                <h1 style="margin:0 0 12px 0;font-size:22px;line-height:1.3;font-weight:700;color:#fffffe;">
                  Olá, ${escapeHtml(username)}!
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:4px 28px 12px 28px;">
                ${renderBlocksToHtml(blocks)}
              </td>
            </tr>
            ${supporterHtml}
            <tr>
              <td style="padding:4px 28px 24px 28px;">
                <p style="margin:0 0 16px 0;color:#a1a1aa;font-size:13px;line-height:1.6;">
                  ${escapeHtml(versionHintText)}
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                  <tr>
                    <td style="border-radius:999px;background:#fffffe;">
                      <a href="${escapeHtml(primaryActionUrl)}" style="display:inline-block;padding:11px 22px;color:#0b0b0f;text-decoration:none;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;">
                        ${escapeHtml(primaryActionLabel)}
                      </a>
                    </td>
                    ${
                      platform
                        ? `<td style="padding-left:12px;">
                            <a href="${escapeHtml(sessionUrl)}" style="display:inline-block;padding:10px 16px;border:1px solid #3f3f46;border-radius:999px;color:#fffffe;text-decoration:none;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.6px;">
                              Outras plataformas
                            </a>
                          </td>`
                        : ""
                    }
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 24px 28px;border-top:1px solid #27272a;color:#71717a;font-size:12px;line-height:1.6;">
                <p style="margin:0 0 8px 0;">
                  Você recebeu este e-mail porque possui conta ativa em <a href="${escapeHtml(cleanOrigin)}" style="color:#a1a1aa;text-decoration:underline;">judhagsan.com</a>.
                </p>
                <p style="margin:0;">
                  Não quer mais receber avisos de novos releases?
                  <a href="${escapeHtml(unsubscribeUrl)}" style="color:#fffffe;text-decoration:underline;">Cancelar avisos de releases</a>
                  ou <a href="${escapeHtml(sessionUrl)}" style="color:#a1a1aa;text-decoration:underline;">faça login e remova a permissão no seu painel</a>.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const textParts = [];
  if (isTest) {
    textParts.push("[ENVIO DE TESTE — conferência antes do disparo]");
  }
  textParts.push(
    cleanTag
      ? `Pindorama ${cleanTag}\n\nOlá, ${username}!`
      : `Olá, ${username}!`,
  );
  const renderedTextBody = renderBlocksToText(blocks);
  if (renderedTextBody) {
    textParts.push(renderedTextBody);
  }
  if (isSupporter) {
    textParts.push(
      "Obrigado por apoiar o desenvolvimento do Pindorama! Cada nova versão sai do papel graças ao seu apoio.",
    );
  }
  textParts.push(
    `${versionHintText}\n${primaryActionLabel}: ${primaryActionUrl}${platform ? `\nOutras plataformas: ${sessionUrl}` : ""}`,
  );
  textParts.push(
    `Atenciosamente,\nEquipe Judhagsan\n\n---\nCancelar avisos de releases: ${unsubscribeUrl}\nOu faça login e remova a permissão no seu painel: ${sessionUrl}`,
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
  parseBodyBlocks,
  sanitizeHeaderValue,
};

export default releaseEmailTemplate;
