import crypto from "node:crypto";
import { validate as isUuid } from "uuid";
import database from "infra/database.js";
import email from "infra/email.js";
import webserver from "infra/webserver.js";
import releaseEmailTemplate from "models/releaseEmailTemplate.js";
import { NotFoundError, ValidationError } from "infra/errors.js";

const FROM_ADDRESS = "Judhagsan <contato@judhagsan.com>";
const DEFAULT_BATCH_SIZE = 10;
const MAX_BATCH_SIZE = 25;
const LIST_DEFAULT_LIMIT = 20;
const LIST_MAX_LIMIT = 50;

const MAX_TAG_LENGTH = 32;
const MIN_SUBJECT_LENGTH = 3;
const MAX_SUBJECT_LENGTH = 160;
const MIN_BODY_LENGTH = 5;
const MAX_BODY_LENGTH = 12000;

function computeContentHash({ kind = "pindorama", tag, subject, body }) {
  const payload = JSON.stringify([
    kind,
    String(tag || "").trim(),
    String(subject || "").trim(),
    String(body || "").trim(),
  ]);
  return crypto.createHash("sha256").update(payload).digest("hex");
}

function isTestedForCurrentContent(announcement) {
  if (!announcement?.tested_at || !announcement?.tested_content_hash) {
    return false;
  }
  return announcement.tested_content_hash === computeContentHash(announcement);
}

function validateUuidOrThrow(id) {
  if (typeof id !== "string" || !isUuid(id)) {
    throw new NotFoundError({
      message: "O aviso informado não foi encontrado.",
      action: "Verifique o identificador do aviso e tente novamente.",
    });
  }
}

function validateInput(input = {}) {
  const kind = input.kind ?? "pindorama";
  if (!["general", "pindorama"].includes(kind)) {
    throw new ValidationError({
      message: "O tipo de novidade informado não é válido.",
      action: "Escolha novidade geral ou versão do Pindorama.",
    });
  }
  const rawTag =
    kind === "general" || input.tag == null ? "" : String(input.tag);
  const rawSubject = input.subject == null ? "" : String(input.subject);
  const rawBody = input.body == null ? "" : String(input.body);

  if (/[\r\n]/.test(rawTag)) {
    throw new ValidationError({
      message: "A versão/tag não pode conter quebras de linha.",
      action: "Informe uma tag simples, como v0.6.2.",
    });
  }

  const tag = rawTag.trim();
  if (tag.length > MAX_TAG_LENGTH) {
    throw new ValidationError({
      message: `A versão/tag deve ter no máximo ${MAX_TAG_LENGTH} caracteres.`,
      action: "Encurte o texto do campo de versão.",
    });
  }

  if (/[\r\n]/.test(rawSubject)) {
    throw new ValidationError({
      message: "O assunto não pode conter quebras de linha.",
      action: "Escreva o assunto em uma única linha.",
    });
  }

  const subject = rawSubject.trim();
  if (subject.length < MIN_SUBJECT_LENGTH) {
    throw new ValidationError({
      message: `O assunto deve ter pelo menos ${MIN_SUBJECT_LENGTH} caracteres.`,
      action: "Informe um assunto descritivo para o email.",
    });
  }
  if (subject.length > MAX_SUBJECT_LENGTH) {
    throw new ValidationError({
      message: `O assunto deve ter no máximo ${MAX_SUBJECT_LENGTH} caracteres.`,
      action: "Reduza o tamanho do assunto.",
    });
  }

  const body = rawBody.trim();
  if (body.length < MIN_BODY_LENGTH) {
    throw new ValidationError({
      message: `A mensagem deve ter pelo menos ${MIN_BODY_LENGTH} caracteres.`,
      action: "Escreva o conteúdo das novidades.",
    });
  }
  if (body.length > MAX_BODY_LENGTH) {
    throw new ValidationError({
      message: `A mensagem deve ter no máximo ${MAX_BODY_LENGTH} caracteres.`,
      action: "Reduza o tamanho da mensagem.",
    });
  }

  return {
    kind,
    tag: tag || null,
    subject,
    body,
  };
}

function formatAnnouncementRow(row) {
  const counts = {
    total: Number(row.total_deliveries || 0),
    sent: Number(row.sent_deliveries || 0),
    failed: Number(row.failed_deliveries || 0),
    pending: Number(row.pending_deliveries || 0),
    skipped: Number(row.skipped_deliveries || 0),
  };

  return {
    id: row.id,
    kind: row.kind ?? "pindorama",
    tag: row.tag,
    subject: row.subject,
    body: row.body,
    status: row.status,
    tested_at: row.tested_at,
    tested_by_user_id: row.tested_by_user_id,
    is_tested_for_current_content: isTestedForCurrentContent(row),
    started_at: row.started_at,
    completed_at: row.completed_at,
    created_by_user_id: row.created_by_user_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    counts,
  };
}

async function countEligibleRecipients() {
  const results = await database.query({
    text: `
      SELECT
        count(*)::int AS total
      FROM
        users
      WHERE
        NOT ('read:activation_token' = ANY(features))
        AND release_emails_enabled = true
    ;`,
  });

  return results.rows[0].total;
}

async function findOneById(id) {
  validateUuidOrThrow(id);

  const results = await database.query({
    text: `
      SELECT
        a.*,
        COALESCE(d.total_deliveries, 0)::int AS total_deliveries,
        COALESCE(d.sent_deliveries, 0)::int AS sent_deliveries,
        COALESCE(d.failed_deliveries, 0)::int AS failed_deliveries,
        COALESCE(d.pending_deliveries, 0)::int AS pending_deliveries,
        COALESCE(d.skipped_deliveries, 0)::int AS skipped_deliveries
      FROM
        release_announcements a
      LEFT JOIN (
        SELECT
          announcement_id,
          count(*) AS total_deliveries,
          count(*) FILTER (WHERE status = 'sent') AS sent_deliveries,
          count(*) FILTER (WHERE status = 'failed') AS failed_deliveries,
          count(*) FILTER (WHERE status IN ('pending', 'processing')) AS pending_deliveries,
          count(*) FILTER (WHERE status = 'skipped') AS skipped_deliveries
        FROM
          release_announcement_deliveries
        WHERE
          announcement_id = $1
        GROUP BY
          announcement_id
      ) d ON d.announcement_id = a.id
      WHERE
        a.id = $1
      LIMIT
        1
    ;`,
    values: [id],
  });

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: "O aviso informado não foi encontrado.",
      action: "Verifique o identificador do aviso e tente novamente.",
    });
  }

  return formatAnnouncementRow(results.rows[0]);
}

async function listAll({ limit } = {}) {
  const parsedLimit = Number.parseInt(limit, 10);
  const safeLimit =
    Number.isInteger(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, LIST_MAX_LIMIT)
      : LIST_DEFAULT_LIMIT;

  const [announcementsResult, eligibleCount] = await Promise.all([
    database.query({
      text: `
        SELECT
          a.*,
          COALESCE(d.total_deliveries, 0)::int AS total_deliveries,
          COALESCE(d.sent_deliveries, 0)::int AS sent_deliveries,
          COALESCE(d.failed_deliveries, 0)::int AS failed_deliveries,
          COALESCE(d.pending_deliveries, 0)::int AS pending_deliveries,
          COALESCE(d.skipped_deliveries, 0)::int AS skipped_deliveries
        FROM
          release_announcements a
        LEFT JOIN (
          SELECT
            announcement_id,
            count(*) AS total_deliveries,
            count(*) FILTER (WHERE status = 'sent') AS sent_deliveries,
            count(*) FILTER (WHERE status = 'failed') AS failed_deliveries,
            count(*) FILTER (WHERE status IN ('pending', 'processing')) AS pending_deliveries,
            count(*) FILTER (WHERE status = 'skipped') AS skipped_deliveries
          FROM
            release_announcement_deliveries
          GROUP BY
            announcement_id
        ) d ON d.announcement_id = a.id
        ORDER BY
          a.created_at DESC
        LIMIT
          $1
      ;`,
      values: [safeLimit],
    }),
    countEligibleRecipients(),
  ]);

  return {
    eligible_recipients: eligibleCount,
    announcements: announcementsResult.rows.map(formatAnnouncementRow),
  };
}

async function create({ kind, tag, subject, body, actorUserId }) {
  const validated = validateInput({ kind, tag, subject, body });

  const results = await database.query({
    text: `
      INSERT INTO
        release_announcements (tag, subject, body, created_by_user_id, kind)
      VALUES
        ($1, $2, $3, $4, $5)
      RETURNING
        *
    ;`,
    values: [
      validated.tag,
      validated.subject,
      validated.body,
      actorUserId || null,
      validated.kind,
    ],
  });

  return formatAnnouncementRow(results.rows[0]);
}

async function update(id, input) {
  validateUuidOrThrow(id);
  const validated = validateInput(input);

  const existing = await database.query({
    text: `SELECT * FROM release_announcements WHERE id = $1 LIMIT 1;`,
    values: [id],
  });

  if (existing.rowCount === 0) {
    throw new NotFoundError({
      message: "O aviso informado não foi encontrado.",
      action: "Verifique o identificador do aviso e tente novamente.",
    });
  }

  const currentRow = existing.rows[0];
  if (currentRow.status !== "draft") {
    throw new ValidationError({
      message:
        "Não é possível editar um aviso depois que o envio foi iniciado.",
      action: "Crie um novo rascunho se quiser enviar uma nova comunicação.",
    });
  }

  const nextHash = computeContentHash(validated);
  const contentChanged = nextHash !== currentRow.tested_content_hash;

  // Se o tipo ou qualquer campo do texto mudou em relação ao que foi testado, limpa os
  // metadados do teste anterior para travar o envio até novo teste real.
  await database.query({
    text: `
      UPDATE
        release_announcements
      SET
        tag = $2,
        subject = $3,
        body = $4,
        kind = $6,
        tested_at = CASE WHEN $5 THEN NULL ELSE tested_at END,
        tested_by_user_id = CASE WHEN $5 THEN NULL ELSE tested_by_user_id END,
        tested_content_hash = CASE WHEN $5 THEN NULL ELSE tested_content_hash END,
        updated_at = timezone('utc', now())
      WHERE
        id = $1
    ;`,
    values: [
      id,
      validated.tag,
      validated.subject,
      validated.body,
      contentChanged,
      validated.kind,
    ],
  });

  return await findOneById(id);
}

async function removeDraft(id) {
  validateUuidOrThrow(id);

  const existing = await database.query({
    text: `SELECT status FROM release_announcements WHERE id = $1 LIMIT 1;`,
    values: [id],
  });

  if (existing.rowCount === 0) {
    throw new NotFoundError({
      message: "O aviso informado não foi encontrado.",
      action: "Verifique o identificador do aviso e tente novamente.",
    });
  }

  if (existing.rows[0].status !== "draft") {
    throw new ValidationError({
      message: "Apenas rascunhos podem ser excluídos.",
      action: "Envios já iniciados ficam registrados no histórico.",
    });
  }

  await database.query({
    text: `DELETE FROM release_announcements WHERE id = $1 AND status = 'draft';`,
    values: [id],
  });
}

async function findLatestDeviceForUser(userId) {
  const results = await database.query({
    text: `
      SELECT
        os,
        pindorama_version
      FROM
        user_devices
      WHERE
        user_id = $1
      ORDER BY
        last_seen_at DESC
      LIMIT
        1
    ;`,
    values: [userId],
  });

  return results.rows[0] || null;
}

async function sendTest(id, { actorUser, simulateSupporter = false } = {}) {
  validateUuidOrThrow(id);

  const announcement = await findOneById(id);
  if (announcement.status !== "draft") {
    throw new ValidationError({
      message: "Este aviso já teve o envio para a base iniciado.",
      action: "Crie um novo rascunho para enviar outro teste.",
    });
  }

  const latestDevice = await findLatestDeviceForUser(actorUser.id);
  const rendered = releaseEmailTemplate.buildReleaseEmail({
    kind: announcement.kind,
    tag: announcement.tag,
    subject: announcement.subject,
    body: announcement.body,
    recipient: {
      username: actorUser.username,
      isSupporter: simulateSupporter
        ? true
        : Boolean(actorUser.features?.includes("apoiador")),
      deviceOs: latestDevice?.os || null,
      deviceVersion: latestDevice?.pindorama_version || null,
      unsubscribeToken: actorUser.email_unsubscribe_token || null,
    },
    origin: webserver.origin,
    isTest: true,
  });

  await email.send({
    from: FROM_ADDRESS,
    to: actorUser.email,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
    headers: rendered.headers,
  });

  const contentHash = computeContentHash(announcement);
  await database.query({
    text: `
      UPDATE
        release_announcements
      SET
        tested_at = timezone('utc', now()),
        tested_by_user_id = $2,
        tested_content_hash = $3,
        updated_at = timezone('utc', now())
      WHERE
        id = $1
    ;`,
    values: [id, actorUser.id, contentHash],
  });

  const updated = await findOneById(id);

  return {
    announcement: updated,
    sent_to: actorUser.email,
  };
}

function sanitizeDeliveryError(error) {
  const message = error?.cause?.message || error?.message || "Falha no envio.";
  return String(message).slice(0, 300);
}

async function sendBatch(
  id,
  { batchSize = DEFAULT_BATCH_SIZE, retryFailed = false } = {},
) {
  validateUuidOrThrow(id);

  const parsedBatch = Number.parseInt(batchSize, 10);
  const safeBatchSize =
    Number.isInteger(parsedBatch) && parsedBatch > 0
      ? Math.min(parsedBatch, MAX_BATCH_SIZE)
      : DEFAULT_BATCH_SIZE;

  const current = await findOneById(id);

  if (current.status === "sent" && !retryFailed) {
    return {
      announcement: current,
      batch: { processed: 0, sent: 0, failed: 0, skipped: 0 },
      remaining: 0,
    };
  }

  // Trava de segurança do lado do servidor: nenhuma chamada direta à API
  // consegue disparar para a base sem que o conteúdo EXATO tenha sido testado.
  if (!current.is_tested_for_current_content) {
    throw new ValidationError({
      message:
        "Envie um email de teste com o conteúdo atual antes de disparar para todos.",
      action:
        "Clique em Enviar teste para mim e confira o resultado antes de desbloquear o envio.",
    });
  }

  if (current.status === "draft") {
    const transition = await database.query({
      text: `
        UPDATE
          release_announcements
        SET
          status = 'sending',
          started_at = COALESCE(started_at, timezone('utc', now())),
          updated_at = timezone('utc', now())
        WHERE
          id = $1
          AND status = 'draft'
        RETURNING
          id
      ;`,
      values: [id],
    });

    if (transition.rowCount > 0) {
      // Congela a fila de destinatários elegíveis no início do disparo.
      // A restrição única em (announcement_id, user_id) impede duplicidades.
      await database.query({
        text: `
          INSERT INTO
            release_announcement_deliveries (
              announcement_id,
              user_id,
              email_snapshot,
              status
            )
          SELECT
            $1,
            u.id,
            u.email,
            'pending'
          FROM
            users u
          WHERE
            NOT ('read:activation_token' = ANY(u.features))
            AND u.release_emails_enabled = true
          ON CONFLICT (announcement_id, user_id) DO NOTHING
        ;`,
        values: [id],
      });
    }
  } else if (retryFailed) {
    await database.query({
      text: `
        UPDATE
          release_announcement_deliveries
        SET
          status = 'pending',
          error_message = NULL
        WHERE
          announcement_id = $1
          AND status = 'failed'
      ;`,
      values: [id],
    });

    await database.query({
      text: `
        UPDATE
          release_announcements
        SET
          status = 'sending',
          completed_at = NULL,
          updated_at = timezone('utc', now())
        WHERE
          id = $1
      ;`,
      values: [id],
    });
  }

  // Reserva atômica do lote com FOR UPDATE SKIP LOCKED: se duas abas ou
  // requisições chamarem `/send` ao mesmo tempo, nenhuma entrega é enviada
  // em duplicidade.
  const pendingResult = await database.query({
    text: `
      WITH claimed AS (
        SELECT
          id
        FROM
          release_announcement_deliveries
        WHERE
          announcement_id = $1
          AND status = 'pending'
        ORDER BY
          created_at ASC,
          id ASC
        LIMIT
          $2
        FOR UPDATE SKIP LOCKED
      ),
      marked AS (
        UPDATE
          release_announcement_deliveries d
        SET
          status = 'processing'
        FROM
          claimed c
        WHERE
          d.id = c.id
        RETURNING
          d.id,
          d.user_id,
          d.email_snapshot,
          d.created_at
      )
      SELECT
        m.id AS delivery_id,
        m.user_id,
        m.email_snapshot,
        u.username,
        u.email AS current_email,
        u.features,
        u.release_emails_enabled,
        u.email_unsubscribe_token,
        dev.os AS device_os,
        dev.pindorama_version AS device_version
      FROM
        marked m
      JOIN
        users u ON u.id = m.user_id
      LEFT JOIN LATERAL (
        SELECT
          os,
          pindorama_version
        FROM
          user_devices
        WHERE
          user_id = u.id
        ORDER BY
          last_seen_at DESC
        LIMIT
          1
      ) dev ON true
      ORDER BY
        m.created_at ASC,
        m.id ASC
    ;`,
    values: [id, safeBatchSize],
  });

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const row of pendingResult.rows) {
    // Reconfere preferência no momento do disparo: se a pessoa desativou os
    // avisos entre um lote e outro, respeitamos imediatamente.
    if (
      row.release_emails_enabled === false ||
      row.features?.includes("read:activation_token")
    ) {
      await database.query({
        text: `
          UPDATE
            release_announcement_deliveries
          SET
            status = 'skipped'
          WHERE
            id = $1
        ;`,
        values: [row.delivery_id],
      });
      skipped += 1;
      continue;
    }

    const recipientEmail = row.current_email || row.email_snapshot;
    const rendered = releaseEmailTemplate.buildReleaseEmail({
      kind: current.kind,
      tag: current.tag,
      subject: current.subject,
      body: current.body,
      recipient: {
        username: row.username,
        isSupporter: Boolean(row.features?.includes("apoiador")),
        deviceOs: row.device_os,
        deviceVersion: row.device_version,
        unsubscribeToken: row.email_unsubscribe_token,
      },
      origin: webserver.origin,
      isTest: false,
    });

    try {
      await email.send({
        from: FROM_ADDRESS,
        to: recipientEmail,
        subject: rendered.subject,
        text: rendered.text,
        html: rendered.html,
        headers: rendered.headers,
      });

      await database.query({
        text: `
          UPDATE
            release_announcement_deliveries
          SET
            status = 'sent',
            email_snapshot = $2,
            error_message = NULL,
            sent_at = timezone('utc', now())
          WHERE
            id = $1
        ;`,
        values: [row.delivery_id, recipientEmail],
      });
      sent += 1;
    } catch (error) {
      await database.query({
        text: `
          UPDATE
            release_announcement_deliveries
          SET
            status = 'failed',
            error_message = $2
          WHERE
            id = $1
        ;`,
        values: [row.delivery_id, sanitizeDeliveryError(error)],
      });
      failed += 1;
    }
  }

  let updated = await findOneById(id);

  if (updated.counts.pending === 0 && updated.status === "sending") {
    await database.query({
      text: `
        UPDATE
          release_announcements
        SET
          status = 'sent',
          completed_at = timezone('utc', now()),
          updated_at = timezone('utc', now())
        WHERE
          id = $1
          AND status = 'sending'
      ;`,
      values: [id],
    });
    updated = await findOneById(id);
  }

  return {
    announcement: updated,
    batch: {
      processed: sent + failed + skipped,
      sent,
      failed,
      skipped,
    },
    remaining: updated.counts.pending,
  };
}

const releaseAnnouncement = {
  DEFAULT_BATCH_SIZE,
  MAX_BATCH_SIZE,
  computeContentHash,
  isTestedForCurrentContent,
  validateInput,
  countEligibleRecipients,
  findOneById,
  listAll,
  create,
  update,
  removeDraft,
  sendTest,
  sendBatch,
};

export default releaseAnnouncement;
