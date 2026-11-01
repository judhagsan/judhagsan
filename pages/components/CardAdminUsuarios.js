import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import useSWR from "swr";
import {
  PeopleIcon,
  ShieldLockIcon,
  HeartFillIcon,
  HeartIcon,
  ClockIcon,
  SearchIcon,
  XCircleFillIcon,
} from "@primer/octicons-react";
import useLanguage from "hooks/useLanguage";

const fetcher = (url) =>
  fetch(url, { credentials: "include" }).then((r) =>
    r.ok ? r.json() : Promise.reject(r),
  );

function formatDate(iso, language) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(language === "pt" ? "pt-BR" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function isPending(features) {
  return Boolean(features?.includes("read:activation_token"));
}

function FunnelBar({ supporters, confirmed, pending, total }) {
  if (total === 0) return null;

  const segments = [
    { value: supporters, className: "bg-amber-400" },
    { value: confirmed, className: "bg-violet-400" },
    { value: pending, className: "bg-zinc-700" },
  ];

  return (
    <div className="flex h-2 w-full overflow-hidden border border-zinc-800 bg-black">
      {segments.map(
        (segment, index) =>
          segment.value > 0 && (
            <div
              key={index}
              className={`${segment.className} transition-[width] duration-300`}
              style={{ width: `${(segment.value / total) * 100}%` }}
            />
          ),
      )}
    </div>
  );
}

function Count({ value, label, dotClassName, valueClassName }) {
  return (
    <span className="inline-flex items-baseline gap-1.5 font-mono text-sm">
      <span
        className={`inline-block w-1.5 h-1.5 translate-y-[-1px] ${dotClassName}`}
      />
      <span className={`font-bold tabular-nums ${valueClassName}`}>
        {value}
      </span>
      <span className="text-zinc-500 uppercase">{label}</span>
    </span>
  );
}

function Badge({ icon, label, className }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs uppercase font-mono tracking-wider shrink-0 ${className}`}
    >
      {icon}
      {label}
    </span>
  );
}

function ConfirmDialog({
  title,
  description,
  confirmLabel,
  tone,
  busy,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 font-mono">
      <div className="absolute inset-0 bg-black" onClick={onCancel} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 w-full max-w-sm rounded-2xl overflow-hidden border-2 border-white bg-black bg-noise flex flex-col card-enter"
      >
        {/* Barra de título do diálogo */}
        <div className="h-10 shrink-0 flex items-center justify-between px-3.5 border-b-2 border-black bg-white text-black select-none">
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onCancel}
              aria-label="Fechar"
              className="w-5 h-5 rounded-full border-2 border-black bg-white flex items-center justify-center hover:bg-black hover:text-white transition-all cursor-pointer group shrink-0 active:scale-90"
            >
              <svg
                className="w-3.5 h-3.5 text-black group-hover:text-white transition-colors"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M10 3.5L5.5 8L10 12.5" />
              </svg>
            </button>
            <span className="w-5 h-5 rounded-full bg-black shrink-0" />
            <span className="w-5 h-5 rounded-full bg-black shrink-0" />
          </div>
          <span className="text-sm font-bold uppercase tracking-wider text-black">
            CONFIRM
          </span>
          <button
            type="button"
            onClick={onCancel}
            className="w-5 h-5 rounded-full border border-black flex items-center justify-center text-xs font-bold text-black hover:bg-black hover:text-white transition-colors cursor-pointer"
          >
            ×
          </button>
        </div>

        <div className="p-5 flex flex-col items-center text-center gap-3">
          <div
            className={`w-12 h-12 rounded-full border flex items-center justify-center ${
              tone === "revoke"
                ? "border-red-600 bg-black text-red-500"
                : "border-amber-400 bg-black text-amber-400"
            }`}
          >
            {tone === "revoke" ? (
              <XCircleFillIcon size={22} />
            ) : (
              <HeartFillIcon size={22} />
            )}
          </div>

          <p className="text-base font-bold uppercase tracking-wider text-white">
            {title}
          </p>
          <p className="text-sm leading-relaxed text-zinc-400">{description}</p>

          <div className="flex gap-3 mt-2 w-full">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="win-btn rounded-full flex-1 py-2 text-sm"
            >
              {confirmLabel.cancel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className={`flex-1 py-2 text-sm font-bold uppercase tracking-wider rounded-full border cursor-pointer transition-colors ${
                tone === "revoke"
                  ? "bg-red-600 hover:bg-red-500 text-white border-red-600"
                  : "bg-amber-400 hover:bg-amber-300 text-black border-amber-400 font-bold"
              }`}
            >
              {busy ? confirmLabel.busy : confirmLabel.action}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CardAdminUsuarios() {
  const { language, t } = useLanguage();

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const timeoutId = setTimeout(() => setSearchTerm(searchInput.trim()), 300);
    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  const listKey = searchTerm
    ? `/api/v1/users?search=${encodeURIComponent(searchTerm)}`
    : "/api/v1/users";

  const { data, error, isLoading, mutate } = useSWR(listKey, fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
    onErrorRetry: (err, _key, _config, revalidate, { retryCount }) => {
      if (err?.status >= 400 && err?.status < 500) return;
      if (retryCount >= 3) return;
      setTimeout(() => revalidate({ retryCount }), 5000 * (retryCount + 1));
    },
  });

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [confirming, setConfirming] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const users = data?.users || [];

  const pendingCount = users.filter((each) => isPending(each.features)).length;
  const supporterCount = users.filter((each) =>
    each.features?.includes("apoiador"),
  ).length;
  const confirmedCount = users.length - pendingCount - supporterCount;

  async function confirmToggle() {
    if (busy || !confirming) return;

    setBusy(true);
    setActionError("");

    try {
      const response = await fetch(
        `/api/v1/users/${confirming.username}/supporter`,
        {
          method: confirming.isSupporter ? "DELETE" : "PUT",
          credentials: "include",
        },
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setActionError(body.message || t("Erro ao alterar apoio"));
        return;
      }

      await mutate();
    } catch {
      setActionError(t("Erro de conexao"));
    } finally {
      setBusy(false);
      setConfirming(null);
    }
  }

  return (
    <div className="w-full font-mono">
      <div className="rounded-2xl overflow-hidden border-2 border-white bg-black bg-noise flex flex-col relative card-enter">
        {/* Barra de Título Branca com Texto Preto */}
        <div className="h-10 shrink-0 flex items-center justify-between px-3.5 border-b-2 border-black bg-white text-black select-none">
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="w-5 h-5 rounded-full border-2 border-black bg-white shrink-0" />
            <span className="w-5 h-5 rounded-full bg-black shrink-0" />
            <span className="w-5 h-5 rounded-full bg-black shrink-0" />
          </div>

          <div className="flex items-center gap-2 min-w-0 mx-2">
            <PeopleIcon size={17} className="shrink-0 text-black" />
            <h2 className="text-sm lg:text-base font-mono font-bold tracking-wider uppercase text-black truncate">
              {t("Usuarios cadastrados")}
            </h2>
          </div>

          <div
            className="w-20 shrink-0 pointer-events-none"
            aria-hidden="true"
          />
        </div>

        <div className="p-4 lg:p-5 flex flex-col gap-3">
          {/* Barra de funil de proporção */}
          {!isLoading && !error && users.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <FunnelBar
                supporters={supporterCount}
                confirmed={confirmedCount}
                pending={pendingCount}
                total={users.length}
              />
            </div>
          )}

          {/* Legenda e Busca */}
          {!error && (users.length > 0 || searchTerm) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 border-b border-zinc-800 pb-3">
              {!isLoading && users.length > 0 && (
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs">
                  {supporterCount > 0 && (
                    <Count
                      value={supporterCount}
                      label={t("apoiadores")}
                      dotClassName="bg-amber-400"
                      valueClassName="text-amber-300"
                    />
                  )}
                  <Count
                    value={confirmedCount}
                    label={t("confirmados")}
                    dotClassName="bg-violet-400"
                    valueClassName="text-violet-300"
                  />
                  <Count
                    value={pendingCount}
                    label={t("pendentes")}
                    dotClassName="bg-zinc-600"
                    valueClassName="text-zinc-500"
                  />
                </div>
              )}

              <label className="flex-1 min-w-[8rem] flex items-center gap-2 px-2.5 py-1.5 bg-black border border-white focus-within:border-white transition-colors">
                <SearchIcon size={14} className="text-zinc-500 shrink-0" />
                <input
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder={t("Buscar por nome ou email")}
                  aria-label={t("Buscar por nome ou email")}
                  className="flex-1 min-w-0 bg-transparent outline-none text-white placeholder-zinc-600 text-sm font-mono"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => setSearchInput("")}
                    aria-label={t("Limpar busca")}
                    className="cursor-pointer text-zinc-500 hover:text-white transition-colors shrink-0"
                  >
                    <XCircleFillIcon size={14} />
                  </button>
                )}
              </label>
            </div>
          )}

          {/* Conteúdo / Lista */}
          <div className="flex flex-col gap-2 text-white">
            {isLoading && (
              <p className="text-zinc-500 text-center py-4 text-sm">
                [{t("Carregando...")}]
              </p>
            )}

            {error && !isLoading && (
              <p className="text-white border border-white p-2.5 text-center text-sm">
                [!] {t("Erro ao carregar usuarios")}
              </p>
            )}

            {!isLoading && !error && users.length === 0 && (
              <p className="text-zinc-500 text-center py-4 text-sm">
                {searchTerm
                  ? t("Nenhum usuario encontrado", { termo: searchTerm })
                  : t("Nenhum usuario cadastrado")}
              </p>
            )}

            {users.length > 0 && (
              <ul className="flex flex-col max-h-[18rem] overflow-y-auto divide-y divide-zinc-800">
                {users.map((userFound) => {
                  const pending = isPending(userFound.features);
                  const supporter = Boolean(
                    userFound.features?.includes("apoiador"),
                  );

                  return (
                    <li
                      key={userFound.id}
                      className="flex items-center gap-3 py-2.5"
                    >
                      <span
                        aria-hidden="true"
                        className={`w-1 self-stretch shrink-0 ${
                          pending
                            ? "bg-zinc-800"
                            : supporter
                              ? "bg-amber-400"
                              : "bg-violet-400"
                        }`}
                      />

                      <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
                          <span className="font-bold text-sm truncate text-white">
                            {userFound.username}
                          </span>

                          {userFound.features?.includes("admin") && (
                            <Badge
                              icon={<ShieldLockIcon size={9} />}
                              label={t("Admin")}
                              className="border-violet-400 bg-violet-400 text-black font-bold"
                            />
                          )}
                          {supporter && (
                            <Badge
                              icon={<HeartFillIcon size={9} />}
                              label={t("Apoiador")}
                              className="border-amber-400 bg-amber-400 text-black font-bold"
                            />
                          )}
                          {pending && (
                            <Badge
                              icon={<ClockIcon size={9} />}
                              label={t("Pendente")}
                              className="border-zinc-700 bg-zinc-800 text-zinc-400"
                            />
                          )}
                        </div>
                        <span className="text-sm text-zinc-400 truncate">
                          {userFound.email}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm text-zinc-400 tabular-nums">
                          {formatDate(userFound.created_at, language)}
                        </span>

                        {!pending && (
                          <button
                            type="button"
                            onClick={() =>
                              setConfirming({
                                username: userFound.username,
                                isSupporter: supporter,
                              })
                            }
                            title={
                              supporter
                                ? t("Revogar apoio")
                                : t("Tornar apoiador")
                            }
                            aria-label={
                              supporter
                                ? t("Revogar apoio")
                                : t("Tornar apoiador")
                            }
                            className={`cursor-pointer inline-flex items-center justify-center w-7 h-7 rounded-full border transition-colors ${
                              supporter
                                ? "border-amber-400 bg-amber-400 text-black hover:bg-amber-300"
                                : "border-zinc-800 bg-black text-zinc-500 hover:text-amber-400 hover:border-amber-400"
                            }`}
                          >
                            {supporter ? (
                              <HeartFillIcon size={12} />
                            ) : (
                              <HeartIcon size={12} />
                            )}
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {actionError && (
              <p className="text-white border border-white p-2.5 text-sm">
                [!] {actionError}
              </p>
            )}

            {data && data.total > users.length && (
              <p className="text-xs uppercase tracking-widest text-zinc-500 text-center pt-2">
                {t("Mostrando n de total", {
                  n: users.length,
                  total: data.total,
                })}
              </p>
            )}
          </div>
        </div>
      </div>

      {mounted &&
        confirming &&
        createPortal(
          <ConfirmDialog
            tone={confirming.isSupporter ? "revoke" : "grant"}
            busy={busy}
            title={
              confirming.isSupporter ? t("Revogar apoio") : t("Tornar apoiador")
            }
            description={
              confirming.isSupporter
                ? t("Texto revogar apoio", { username: confirming.username })
                : t("Texto tornar apoiador", { username: confirming.username })
            }
            confirmLabel={{
              cancel: t("Cancelar"),
              busy: t("Salvando..."),
              action: confirming.isSupporter
                ? t("Revogar apoio")
                : t("Tornar apoiador"),
            }}
            onConfirm={confirmToggle}
            onCancel={() => {
              if (!busy) setConfirming(null);
            }}
          />,
          document.body,
        )}
    </div>
  );
}
