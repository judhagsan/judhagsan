import dns from "node:dns";
import { ValidationError } from "infra/errors.js";

// Formato pragmático (estilo HTML5): local@dominio.tld, sem espaços. Não tenta
// cobrir todos os casos exóticos da RFC 5322 (que rejeitam mais válidos do que
// pegam inválidos) — só o suficiente para barrar lixo e typos óbvios.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254; // limite de endereço da RFC 5321

function validateFormat(email) {
  const value = typeof email === "string" ? email.trim() : "";
  if (!value || value.length > MAX_EMAIL_LENGTH || !EMAIL_REGEX.test(value)) {
    throw new ValidationError({
      message: "Email inválido.",
      action: "Informe um endereço de email válido.",
    });
  }
  return value;
}

// Confirma que o domínio consegue receber email: tem registro MX ou, na falta
// dele, ao menos um registro de endereço (A/AAAA), que a RFC 5321 aceita como
// destino. Falhas transitórias de DNS (timeout, SERVFAIL) usam FAIL-OPEN — não
// bloqueamos um cadastro legítimo por instabilidade momentânea de resolução.
async function validateDomainIsDeliverable(email) {
  const domain = email.split("@")[1];
  if (!domain) return;

  let mxRecords;
  try {
    mxRecords = await dns.promises.resolveMx(domain);
  } catch (error) {
    // ENOTFOUND: domínio não existe. ENODATA: existe mas sem MX. Nesses dois
    // casos ainda tentamos o fallback de A/AAAA. Qualquer outro erro é tratado
    // como instabilidade de DNS e deixamos passar.
    if (error.code !== "ENOTFOUND" && error.code !== "ENODATA") {
      return;
    }
    mxRecords = [];
  }

  if (mxRecords.some((record) => record?.exchange)) {
    return;
  }

  // Sem MX utilizável: tenta o fallback de registro de endereço.
  try {
    const addresses = await dns.promises.resolve(domain);
    if (addresses.length > 0) return;
  } catch {
    // sem A/AAAA também — cai no throw abaixo
  }

  throw new ValidationError({
    message: "O domínio do email não parece receber mensagens.",
    action: "Verifique se digitou o email corretamente.",
  });
}

// Valida formato e capacidade de entrega do domínio. Retorna o email já
// normalizado (com trim) para o chamador usar no armazenamento.
async function assertValidEmail(email) {
  const normalized = validateFormat(email);
  await validateDomainIsDeliverable(normalized);
  return normalized;
}

const emailValidation = {
  validateFormat,
  validateDomainIsDeliverable,
  assertValidEmail,
};

export default emailValidation;
