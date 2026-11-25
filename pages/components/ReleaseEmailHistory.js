import { TrashIcon } from "@primer/octicons-react";
import useLanguage from "hooks/useLanguage";

function StatusBadge({ status, t }) {
  if (status === "sent") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-emerald-400 bg-emerald-400 text-black text-xs font-bold uppercase tracking-wider shrink-0">
        {t("Enviado")}
      </span>
    );
  }

  if (status === "sending") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-amber-400 bg-amber-400 text-black text-xs font-bold uppercase tracking-wider shrink-0">
        {t("Enviando")}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-zinc-700 bg-zinc-800 text-zinc-300 text-xs uppercase tracking-wider shrink-0">
      {t("Rascunho")}
    </span>
  );
}

export default function ReleaseEmailHistory({
  announcements = [],
  activeId = null,
  isSending = false,
  deletingId = null,
  formatDateTime,
  onSelect,
  onResume,
  onRetryFailed,
  onDelete,
} = {}) {
  const { language, t } = useLanguage();

  if (announcements.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 border-t border-zinc-800 pt-3">
      <span className="text-xs uppercase tracking-wider text-zinc-500">
        {t("Historico de envios")}
      </span>
      <ul className="flex flex-col max-h-[14rem] overflow-y-auto divide-y divide-zinc-800">
        {announcements.map((item) => {
          const selected = item.id === activeId;
          return (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
            >
              <button
                type="button"
                onClick={() => onSelect?.(item)}
                className="cursor-pointer flex flex-col items-start text-left min-w-0 flex-1 gap-0.5 group"
              >
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  {item.tag && (
                    <span className="text-xs font-bold text-zinc-300">
                      {item.tag}
                    </span>
                  )}
                  <span
                    className={`font-bold truncate ${
                      selected
                        ? "text-white underline"
                        : "text-zinc-200 group-hover:text-white"
                    }`}
                  >
                    {item.subject}
                  </span>
                  <StatusBadge status={item.status} t={t} />
                </div>
                <span className="text-xs text-zinc-500 tabular-nums">
                  {formatDateTime?.(item.created_at, language) ?? "—"}
                  {item.status !== "draft" &&
                    ` · ${t("Contagem entregas", {
                      sent: item.counts.sent,
                      total: item.counts.total,
                      failed: item.counts.failed,
                    })}`}
                </span>
              </button>

              <div className="flex items-center gap-1.5 shrink-0">
                {item.status === "sending" && item.counts.pending > 0 && (
                  <button
                    type="button"
                    disabled={isSending}
                    onClick={() => onResume?.(item.id)}
                    className="win-btn text-xs px-3 py-1"
                  >
                    {t("Retomar envio")}
                  </button>
                )}

                {item.status === "sent" && item.counts.failed > 0 && (
                  <button
                    type="button"
                    disabled={isSending}
                    onClick={() => onRetryFailed?.(item.id)}
                    className="win-btn text-xs px-3 py-1"
                  >
                    {t("Retentar falhas")}
                  </button>
                )}

                {item.status === "draft" && (
                  <button
                    type="button"
                    disabled={deletingId === item.id || isSending}
                    onClick={() => onDelete?.(item.id)}
                    aria-label={t("Excluir rascunho")}
                    title={t("Excluir rascunho")}
                    className="cursor-pointer inline-flex items-center justify-center w-7 h-7 rounded-full border border-zinc-800 bg-black text-zinc-500 hover:text-white hover:border-white transition-colors disabled:opacity-50"
                  >
                    <TrashIcon size={12} />
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
