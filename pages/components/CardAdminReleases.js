import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import useSWR from "swr";
import {
  MailIcon,
  PaperAirplaneIcon,
  CheckCircleFillIcon,
  LockIcon,
  UnlockIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  SyncIcon,
  AlertFillIcon,
} from "@primer/octicons-react";
import useLanguage from "hooks/useLanguage";
import useUser from "hooks/useUser";
import releaseEmailTemplate from "models/releaseEmailTemplate.js";
import CardNormal from "./CardNormal";
import ReleaseEmailPreview from "./ReleaseEmailPreview";
import ReleaseEmailHistory from "./ReleaseEmailHistory";

const EMPTY_LIST = [];

const DATE_TIME_FORMATTERS = {
  pt: new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }),
  en: new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }),
};

const fetcher = (url) =>
  fetch(url, { credentials: "include" }).then((r) =>
    r.ok ? r.json() : Promise.reject(r),
  );

const versionFetcher = (url) =>
  fetch(url).then((r) => (r.ok ? r.json() : null));

function formatDateTime(iso, language) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return (DATE_TIME_FORMATTERS[language] || DATE_TIME_FORMATTERS.pt).format(
    date,
  );
}

function ConfirmSendDialog({
  tag,
  subject,
  recipientCount,
  busy,
  onConfirm,
  onCancel,
}) {
  const { t } = useLanguage();

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape" && !busy) onCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [busy, onCancel]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/90"
        onClick={() => {
          if (!busy) onCancel();
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("Confirmar envio de release")}
        className="relative z-10 w-full max-w-md"
      >
        <CardNormal
          title={t("Confirmar envio de release")}
          icon={PaperAirplaneIcon}
          onBack={busy ? undefined : onCancel}
          backLabel={t("Cancelar")}
          className="card-enter"
          bodyClassName="p-5 flex flex-col items-center text-center gap-3 text-white"
        >
          <div className="w-12 h-12 rounded-full border border-white bg-black text-white flex items-center justify-center">
            <PaperAirplaneIcon size={20} />
          </div>

          <p className="text-base font-bold uppercase tracking-wider text-white">
            {t("Enviar para n destinatarios", { n: recipientCount })}
          </p>

          <p className="text-sm leading-relaxed text-zinc-400">
            {t("Texto confirmar envio release")}
          </p>

          <div className="w-full text-left border border-zinc-800 bg-zinc-950 p-3 flex flex-col gap-1 text-xs">
            {tag && (
              <span className="uppercase tracking-wider text-zinc-400">
                {t("Versao")}: <strong className="text-white">{tag}</strong>
              </span>
            )}
            <span className="text-zinc-400 break-words">
              {t("Assunto")}: <strong className="text-white">{subject}</strong>
            </span>
          </div>

          <div className="flex gap-3 mt-2 w-full">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="win-btn flex-1 text-sm"
            >
              {t("Cancelar")}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className="win-btn-primary flex-1 text-sm"
            >
              {busy ? t("Enviando...") : t("Confirmar envio")}
            </button>
          </div>
        </CardNormal>
      </div>
    </div>
  );
}

export default function CardAdminReleases({ fullPage = false, onBack } = {}) {
  const { language, t } = useLanguage();
  const { user } = useUser();

  const { data, error, isLoading, mutate } = useSWR(
    "/api/v1/releases/announcements",
    fetcher,
    {
      revalidateOnFocus: false,
      onErrorRetry: (err, _key, _config, revalidate, { retryCount }) => {
        if (err?.status >= 400 && err?.status < 500) return;
        if (retryCount >= 3) return;
        setTimeout(() => revalidate({ retryCount }), 5000 * (retryCount + 1));
      },
    },
  );

  const { data: versionData } = useSWR("/api/v1/version", versionFetcher, {
    revalidateOnFocus: false,
  });

  const announcements = data?.announcements ?? EMPTY_LIST;
  const eligibleRecipients = data?.eligible_recipients ?? 0;

  const [activeId, setActiveId] = useState(null);
  const [tag, setTag] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  const [tab, setTab] = useState("edit");
  const [previewSupporter, setPreviewSupporter] = useState(false);
  const [previewPlatform, setPreviewPlatform] = useState("windows");
  const [simulateSupporterTest, setSimulateSupporterTest] = useState(false);

  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [sendProgress, setSendProgress] = useState(null);

  const [mounted, setMounted] = useState(false);
  const stopRequestedRef = useRef(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (initializedRef.current) return;
    if (versionData?.tag && !activeId && !tag) {
      setTag(versionData.tag);
      initializedRef.current = true;
    }
  }, [versionData, activeId, tag]);

  const activeAnnouncement = useMemo(
    () => announcements.find((item) => item.id === activeId) || null,
    [announcements, activeId],
  );

  const isLockedDraft = Boolean(
    activeAnnouncement && activeAnnouncement.status !== "draft",
  );

  const isUnlockedForBroadcast = Boolean(
    activeAnnouncement &&
    activeAnnouncement.status === "draft" &&
    activeAnnouncement.is_tested_for_current_content &&
    !isDirty,
  );

  const previewEmail = useMemo(() => {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://judhagsan.com";

    const previewOsByKey = {
      windows: "Windows 11",
      macos: "macOS 15",
      linux: "Linux",
      none: null,
    };

    return releaseEmailTemplate.buildReleaseEmail({
      tag,
      subject: subject || t("Placeholder assunto release"),
      body: body || t("Placeholder mensagem release"),
      recipient: {
        username: user?.username || "animador",
        isSupporter: previewSupporter,
        deviceOs: previewOsByKey[previewPlatform] ?? null,
        deviceVersion: "0.6.1",
        unsubscribeToken: null,
      },
      origin,
      isTest: false,
    });
  }, [tag, subject, body, user, previewSupporter, previewPlatform, t]);

  function loadDraft(announcement) {
    setActiveId(announcement.id);
    setTag(announcement.tag || "");
    setSubject(announcement.subject || "");
    setBody(announcement.body || "");
    setIsDirty(false);
    setStatusMessage("");
    setErrorMessage("");
    setTab("edit");
  }

  function startNewDraft() {
    setActiveId(null);
    setTag(versionData?.tag || "");
    setSubject("");
    setBody("");
    setIsDirty(false);
    setStatusMessage("");
    setErrorMessage("");
    setTab("edit");
  }

  async function persistDraft() {
    const payload = {
      tag: tag.trim(),
      subject: subject.trim(),
      body: body.trim(),
    };

    const url = activeId
      ? `/api/v1/releases/announcements/${activeId}`
      : "/api/v1/releases/announcements";
    const method = activeId ? "PATCH" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const responseBody = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(responseBody.message || t("Erro salvar rascunho"));
    }

    setActiveId(responseBody.id);
    setTag(responseBody.tag || "");
    setSubject(responseBody.subject || "");
    setBody(responseBody.body || "");
    setIsDirty(false);

    return responseBody;
  }

  async function handleSaveDraft() {
    if (isSaving || isTesting || isSending || isLockedDraft) return;
    setIsSaving(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      await persistDraft();
      await mutate();
      setStatusMessage(t("Rascunho salvo"));
    } catch (err) {
      setErrorMessage(err.message || t("Erro salvar rascunho"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSendTest() {
    if (isTesting || isSaving || isSending || isLockedDraft) return;
    setIsTesting(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const saved =
        !activeId || isDirty ? await persistDraft() : activeAnnouncement;

      const response = await fetch(
        `/api/v1/releases/announcements/${saved.id}/test`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            simulate_supporter: simulateSupporterTest,
          }),
        },
      );

      const responseBody = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(responseBody.message || t("Erro enviar teste"));
      }

      await mutate();
      setStatusMessage(
        t("Teste enviado com sucesso", { email: responseBody.sent_to }),
      );
    } catch (err) {
      setErrorMessage(err.message || t("Erro enviar teste"));
    } finally {
      setIsTesting(false);
    }
  }

  async function runBroadcastLoop(
    announcementId,
    { retryFailed = false } = {},
  ) {
    setIsSending(true);
    setErrorMessage("");
    setStatusMessage("");
    stopRequestedRef.current = false;

    let firstBatch = true;

    try {
      while (!stopRequestedRef.current) {
        const response = await fetch(
          `/api/v1/releases/announcements/${announcementId}/send`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              batch_size: 10,
              retry_failed: firstBatch && retryFailed,
            }),
          },
        );

        firstBatch = false;
        const responseBody = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(responseBody.message || t("Erro enviar release"));
        }

        const counts = responseBody.announcement?.counts || {
          total: 0,
          sent: 0,
          failed: 0,
          pending: 0,
          skipped: 0,
        };

        setSendProgress({
          id: announcementId,
          ...counts,
          done: responseBody.remaining === 0,
        });

        await mutate();

        if (responseBody.remaining === 0) {
          setStatusMessage(
            t("Envio concluido resumo", {
              sent: counts.sent,
              failed: counts.failed,
            }),
          );
          break;
        }
      }

      if (stopRequestedRef.current) {
        setStatusMessage(t("Envio pausado aviso"));
      }
    } catch (err) {
      setErrorMessage(err.message || t("Erro enviar release"));
    } finally {
      setIsSending(false);
      setConfirmOpen(false);
    }
  }

  async function handleDeleteDraft(id) {
    if (deletingId || isSending) return;
    setDeletingId(id);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const response = await fetch(`/api/v1/releases/announcements/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok && response.status !== 204) {
        const responseBody = await response.json().catch(() => ({}));
        throw new Error(responseBody.message || t("Erro excluir rascunho"));
      }

      if (activeId === id) {
        startNewDraft();
      }
      await mutate();
    } catch (err) {
      setErrorMessage(err.message || t("Erro excluir rascunho"));
    } finally {
      setDeletingId(null);
    }
  }

  const formDisabled = isLockedDraft || isSending || isTesting || isSaving;

  return (
    <>
      <CardNormal
        title={t("Emails de releases")}
        icon={MailIcon}
        onBack={onBack}
        backLabel={t("Voltar ao painel")}
        className={`card-enter ${fullPage ? "lg:h-full" : ""}`}
        bodyClassName={
          fullPage
            ? "p-4 lg:p-5 flex-1 min-h-0 flex flex-col gap-4 text-white overflow-y-auto lg:overflow-hidden"
            : "p-4 lg:p-5 flex flex-col gap-4 text-white"
        }
        actions={
          <span className="text-[10px] uppercase tracking-wider rounded-full border border-black px-2 py-0.5 text-zinc-800 font-bold whitespace-nowrap tabular-nums">
            {t("n elegiveis", { n: eligibleRecipients })}
          </span>
        }
      >
        {isLoading && (
          <p className="text-zinc-500 text-center py-4 text-sm">
            [{t("Carregando...")}]
          </p>
        )}

        {error && !isLoading && (
          <p className="text-white border border-white p-2.5 text-center text-sm">
            [!] {t("Erro ao carregar envios")}
          </p>
        )}

        {!isLoading && !error && (
          <div
            className={
              fullPage
                ? "flex flex-col gap-4 flex-1 min-h-0 lg:grid lg:grid-cols-2 lg:gap-5"
                : "flex flex-col gap-4"
            }
          >
            {/* Coluna de edição, trava, disparo e histórico */}
            <div
              className={
                fullPage
                  ? "flex flex-col gap-4 lg:min-h-0 lg:overflow-y-auto lg:pr-1"
                  : "flex flex-col gap-4"
              }
            >
              <div
                className={`flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3 ${
                  fullPage && !activeId ? "lg:hidden" : ""
                }`}
              >
                <div
                  className={`flex items-center gap-1.5 ${
                    fullPage ? "lg:hidden" : ""
                  }`}
                  role="tablist"
                  aria-label={t("Emails de releases")}
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={tab === "edit"}
                    onClick={() => setTab("edit")}
                    className={`cursor-pointer inline-flex items-center gap-1.5 rounded-full text-xs px-3.5 py-1 border transition-colors ${
                      tab === "edit"
                        ? "bg-white border-white text-black font-bold"
                        : "border-zinc-800 bg-black text-zinc-400 hover:text-white hover:border-zinc-600"
                    }`}
                  >
                    <PencilIcon size={12} />
                    {t("Editar")}
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={tab === "preview"}
                    onClick={() => setTab("preview")}
                    className={`cursor-pointer inline-flex items-center gap-1.5 rounded-full text-xs px-3.5 py-1 border transition-colors ${
                      tab === "preview"
                        ? "bg-white border-white text-black font-bold"
                        : "border-zinc-800 bg-black text-zinc-400 hover:text-white hover:border-zinc-600"
                    }`}
                  >
                    <EyeIcon size={12} />
                    {t("Previa")}
                  </button>
                </div>

                {activeId && (
                  <button
                    type="button"
                    onClick={startNewDraft}
                    disabled={isSending}
                    className="win-btn text-xs px-3 py-1 ml-auto"
                  >
                    <PlusIcon size={12} />
                    {t("Novo rascunho")}
                  </button>
                )}
              </div>

              <div
                className={`flex flex-col gap-3 ${
                  tab === "preview"
                    ? fullPage
                      ? "hidden lg:flex"
                      : "hidden"
                    : "flex"
                }`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs uppercase tracking-wider text-zinc-400">
                      {t("Versao")}
                    </span>
                    <input
                      type="text"
                      value={tag}
                      onChange={(event) => {
                        setTag(event.target.value);
                        setIsDirty(true);
                      }}
                      disabled={formDisabled}
                      maxLength={32}
                      placeholder={versionData?.tag || "v0.6.2"}
                      className="win-input text-sm"
                    />
                  </label>

                  <label className="sm:col-span-2 flex flex-col gap-1">
                    <span className="text-xs uppercase tracking-wider text-zinc-400">
                      {t("Assunto")}
                    </span>
                    <input
                      type="text"
                      value={subject}
                      onChange={(event) => {
                        setSubject(event.target.value);
                        setIsDirty(true);
                      }}
                      disabled={formDisabled}
                      maxLength={160}
                      placeholder={t("Placeholder assunto release")}
                      className="win-input text-sm"
                    />
                  </label>
                </div>

                <label className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-xs uppercase tracking-wider text-zinc-400">
                      {t("Mensagem")}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {t("Dica formatacao email")}
                    </span>
                  </div>
                  <textarea
                    rows={fullPage ? 10 : 6}
                    value={body}
                    onChange={(event) => {
                      setBody(event.target.value);
                      setIsDirty(true);
                    }}
                    disabled={formDisabled}
                    maxLength={12000}
                    placeholder={t("Placeholder mensagem release")}
                    className={`win-input text-sm leading-relaxed resize-y ${
                      fullPage ? "min-h-[12rem]" : "min-h-[8rem]"
                    }`}
                  />
                </label>

                {!isLockedDraft && (
                  <label className="inline-flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={simulateSupporterTest}
                      onChange={(event) =>
                        setSimulateSupporterTest(event.target.checked)
                      }
                      disabled={formDisabled}
                      className="accent-amber-400 cursor-pointer"
                    />
                    <span>{t("Simular apoiador no teste")}</span>
                  </label>
                )}
              </div>

              {!isLockedDraft && (
                <div
                  className={`flex items-start gap-2.5 p-3 border text-xs leading-relaxed ${
                    isUnlockedForBroadcast
                      ? "border-emerald-500/60 bg-emerald-950/20 text-emerald-200"
                      : "border-zinc-800 bg-zinc-950 text-zinc-400"
                  }`}
                >
                  {isUnlockedForBroadcast ? (
                    <UnlockIcon
                      size={14}
                      className="shrink-0 mt-0.5 text-emerald-400"
                    />
                  ) : (
                    <LockIcon
                      size={14}
                      className="shrink-0 mt-0.5 text-zinc-500"
                    />
                  )}
                  <span>
                    {isUnlockedForBroadcast
                      ? t("Envio desbloqueado aviso", {
                          date: formatDateTime(
                            activeAnnouncement.tested_at,
                            language,
                          ),
                        })
                      : isDirty && activeAnnouncement?.tested_at
                        ? t("Texto alterado apos teste")
                        : t("Envio bloqueado ate testar")}
                  </span>
                </div>
              )}

              {sendProgress && (
                <div className="flex flex-col gap-2 border border-zinc-800 bg-zinc-950 p-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-white font-bold uppercase tracking-wider">
                      {sendProgress.done
                        ? t("Disparo finalizado")
                        : t("Enviando lotes...")}
                    </span>
                    <span className="text-zinc-400 tabular-nums">
                      {sendProgress.sent +
                        sendProgress.failed +
                        sendProgress.skipped}{" "}
                      / {sendProgress.total}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-black border border-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 transition-[width] duration-300"
                      style={{
                        width: `${
                          sendProgress.total > 0
                            ? Math.min(
                                ((sendProgress.sent +
                                  sendProgress.failed +
                                  sendProgress.skipped) /
                                  sendProgress.total) *
                                  100,
                                100,
                              )
                            : 100
                        }%`,
                      }}
                    />
                  </div>
                  {isSending && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          stopRequestedRef.current = true;
                        }}
                        className="win-btn win-btn-muted text-xs px-3 py-1"
                      >
                        {t("Pausar envio")}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {!isLockedDraft && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={
                      isSaving ||
                      isTesting ||
                      isSending ||
                      !subject.trim() ||
                      !body.trim()
                    }
                    className="win-btn text-xs"
                  >
                    {isSaving ? t("Salvando...") : t("Salvar rascunho")}
                  </button>

                  <button
                    type="button"
                    onClick={handleSendTest}
                    disabled={
                      isTesting ||
                      isSaving ||
                      isSending ||
                      !subject.trim() ||
                      !body.trim()
                    }
                    className={`${
                      isUnlockedForBroadcast ? "win-btn" : "win-btn-primary"
                    } text-xs`}
                  >
                    {isTesting ? (
                      <SyncIcon size={13} className="animate-spin" />
                    ) : (
                      <MailIcon size={13} />
                    )}
                    <span>
                      {isTesting
                        ? t("Enviando teste...")
                        : t("Enviar teste para mim")}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmOpen(true)}
                    disabled={
                      !isUnlockedForBroadcast ||
                      isSending ||
                      eligibleRecipients === 0
                    }
                    className={`${
                      isUnlockedForBroadcast
                        ? "win-btn-primary"
                        : "win-btn win-btn-muted"
                    } text-xs ml-auto`}
                  >
                    <PaperAirplaneIcon size={13} />
                    <span>
                      {t("Enviar para todos n", { n: eligibleRecipients })}
                    </span>
                  </button>
                </div>
              )}

              {statusMessage && (
                <p className="flex items-center gap-2 text-sm text-white border border-white bg-zinc-950 p-2.5">
                  <CheckCircleFillIcon
                    size={14}
                    className="shrink-0 text-emerald-400"
                  />
                  <span>{statusMessage}</span>
                </p>
              )}

              {errorMessage && (
                <p className="flex items-center gap-2 text-sm text-white border border-white bg-zinc-950 p-2.5">
                  <AlertFillIcon size={14} className="shrink-0 text-red-400" />
                  <span>{errorMessage}</span>
                </p>
              )}

              <ReleaseEmailHistory
                announcements={announcements}
                activeId={activeId}
                isSending={isSending}
                deletingId={deletingId}
                formatDateTime={formatDateTime}
                onSelect={loadDraft}
                onResume={(id) => runBroadcastLoop(id)}
                onRetryFailed={(id) =>
                  runBroadcastLoop(id, { retryFailed: true })
                }
                onDelete={handleDeleteDraft}
              />
            </div>

            <ReleaseEmailPreview
              previewEmail={previewEmail}
              previewSupporter={previewSupporter}
              onToggleSupporter={setPreviewSupporter}
              previewPlatform={previewPlatform}
              onChangePlatform={setPreviewPlatform}
              fullPage={fullPage}
              visibleOnMobile={tab === "preview"}
            />
          </div>
        )}
      </CardNormal>

      {mounted &&
        confirmOpen &&
        activeAnnouncement &&
        createPortal(
          <ConfirmSendDialog
            tag={activeAnnouncement.tag}
            subject={activeAnnouncement.subject}
            recipientCount={eligibleRecipients}
            busy={isSending}
            onConfirm={() => runBroadcastLoop(activeAnnouncement.id)}
            onCancel={() => {
              if (!isSending) setConfirmOpen(false);
            }}
          />,
          document.body,
        )}
    </>
  );
}
