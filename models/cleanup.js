import database from "infra/database.js";
import supporter from "models/supporter.js";

async function runCleanup() {
  const [
    sessionsResult,
    activationTokensResult,
    rateLimitsResult,
    auditLogsResult,
  ] = await Promise.all([
    database.query({
      text: `
        DELETE FROM sessions
        WHERE expires_at < NOW()
        RETURNING id
      ;`,
    }),
    database.query({
      text: `
        DELETE FROM user_activation_tokens
        WHERE expires_at < NOW() OR used_at IS NOT NULL
        RETURNING id
      ;`,
    }),
    database.query({
      text: `
        DELETE FROM rate_limits
        WHERE window_started_at < NOW() - INTERVAL '1 day'
        RETURNING identifier
      ;`,
    }),
    database.query({
      text: `
        DELETE FROM audit_logs
        WHERE created_at < NOW() - INTERVAL '90 days'
        RETURNING id
      ;`,
    }),
  ]);

  // Apoio vencido perde a feature aqui, não no webhook: assim uma renovação
  // que nunca chega também expira.
  const supportersExpired = await supporter.expireOverdue();

  return {
    supporters_expired: supportersExpired,
    sessions_deleted: sessionsResult.rowCount,
    activation_tokens_deleted: activationTokensResult.rowCount,
    rate_limits_deleted: rateLimitsResult.rowCount,
    audit_logs_deleted: auditLogsResult.rowCount,
  };
}

const cleanup = {
  runCleanup,
};

export default cleanup;
