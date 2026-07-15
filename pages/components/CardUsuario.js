import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  PersonFillIcon,
  PackageIcon,
  TrashIcon,
  AlertFillIcon,
  HeartFillIcon,
  CheckCircleFillIcon,
} from "@primer/octicons-react";
import useLanguage from "hooks/useLanguage";

function DiscordIcon({ size = 16, className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
    </svg>
  );
}

export default function CardUsuario({ user }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [wallOptIn, setWallOptIn] = useState(
    user?.supporter_wall_opt_in ?? false,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const isSupporter = user?.features?.includes("apoiador");
  const discordResult = router.query.discord;
  const discordReason = router.query.reason;
  const apoioResult = router.query.apoio;

  const confirmationMatches = confirmationInput === user?.username;

  async function handleWallOptInChange(event) {
    const nextValue = event.target.checked;
    if (isSaving) return;

    setIsSaving(true);
    setSaveError("");

    try {
      const response = await fetch("/api/v1/user/supporter", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wall_opt_in: nextValue }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setSaveError(body.message || t("Erro ao salvar"));
        return;
      }

      const body = await response.json();
      setWallOptIn(body.supporter_wall_opt_in);
    } catch {
      setSaveError(t("Erro de conexao"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleExport() {
    if (isExporting) return;
    setIsExporting(true);
    setExportError("");
    try {
      const response = await fetch("/api/v1/user/export", {
        credentials: "include",
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setExportError(body.message || t("Erro exportar"));
        return;
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="(.+)"/);
      const filename = match?.[1] || "judhagsan-export.json";

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setExportError(t("Erro de conexao"));
    } finally {
      setIsExporting(false);
    }
  }

  async function handleDelete(event) {
    event.preventDefault();
    if (!confirmationMatches || isDeleting) return;

    setIsDeleting(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/v1/users/${user.username}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok && response.status !== 204) {
        const body = await response.json();
        setErrorMessage(body.message || t("Erro excluir conta"));
        setIsDeleting(false);
        return;
      }

      router.replace("/");
    } catch {
      setErrorMessage(t("Erro de conexao"));
      setIsDeleting(false);
    }
  }

  return (
    <div className="w-full h-auto">
      <div
        className={`glass-card rounded-[20px] p-6 shadow-2xl relative overflow-hidden flex flex-col h-auto group transition-all duration-500 ${
          isSupporter
            ? "hover:shadow-[0_0_30px_rgba(245,158,11,0.12)]"
            : "hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]"
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent -z-10 pointer-events-none"></div>

        {isConfirming ? (
          <form
            onSubmit={handleDelete}
            className="flex flex-col items-center justify-center text-center gap-4 text-white/70 font-mono text-sm relative z-10 flex-1 h-full animate-[fadeIn_0.18s_ease-out]"
          >
            <div className="w-14 h-14 rounded-full bg-red-500/20 border border-red-400/40 flex items-center justify-center text-red-200">
              <AlertFillIcon size={28} />
            </div>
            <p className="text-lg text-white font-semibold">
              {t("Excluir conta")}
            </p>
            <p className="text-xs leading-relaxed max-w-xs">
              {t("Texto excluir conta aviso")}
            </p>
            <label className="flex flex-col gap-1 w-full max-w-xs">
              <span className="text-xs uppercase tracking-widest text-white/50">
                {t("Digite para confirmar", { username: user?.username })}
              </span>
              <input
                type="text"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                autoComplete="off"
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-red-400/60 focus:bg-white/10 outline-none text-white placeholder-white/30 transition-colors text-center"
                placeholder={user?.username}
              />
            </label>

            {errorMessage && (
              <p className="text-red-300 text-xs">{errorMessage}</p>
            )}

            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={() => {
                  setIsConfirming(false);
                  setConfirmationInput("");
                  setErrorMessage("");
                }}
                disabled={isDeleting}
                className="cursor-pointer px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/70 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm"
              >
                {t("Cancelar")}
              </button>
              <button
                type="submit"
                disabled={!confirmationMatches || isDeleting}
                className="cursor-pointer px-6 py-2 bg-red-500/10 hover:bg-red-500/30 border border-red-500/30 hover:border-red-500/60 text-red-200 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm inline-flex items-center gap-2"
              >
                <TrashIcon size={14} />
                {isDeleting ? t("Excluindo...") : t("Excluir")}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-4 text-white/70 font-mono text-sm relative z-10 flex-1 h-full animate-[fadeIn_0.4s_ease-out]">
            {/* Identidade — o selo no avatar é quem conta o status de apoiador */}
            <div className="flex items-center gap-4 text-left">
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-200">
                  <PersonFillIcon size={28} />
                </div>
                {isSupporter && (
                  <span
                    title={t("Apoiador")}
                    className="absolute -bottom-0.5 -right-1 w-6 h-6 rounded-full bg-amber-400 border-2 border-[#141414] flex items-center justify-center text-[#3a2a00] shadow-lg shadow-amber-500/40"
                  >
                    <HeartFillIcon size={12} />
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <p className="text-base lg:text-lg text-white font-semibold">
                  {t("Bem vindo", { username: user?.username })}
                </p>
                <p className="text-xs text-white/50 break-all">{user?.email}</p>
              </div>
            </div>

            {/* Retorno do checkout de assinatura */}
            {apoioResult === "sucesso" && (
              <p className="text-emerald-300 text-xs animate-[fadeIn_0.3s_ease-out]">
                {t("Texto apoio recebido")}
              </p>
            )}

            {/* Apoiador */}
            {isSupporter && (
              <div className="flex flex-col gap-3 animate-[fadeIn_0.4s_ease-out]">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] uppercase tracking-widest text-amber-300/80 font-semibold">
                    {t("Apoiador")}
                  </span>
                  <span className="h-px flex-1 bg-gradient-to-r from-amber-400/30 to-transparent"></span>
                </div>

                {discordResult === "connected" && (
                  <p className="text-emerald-300 text-xs animate-[fadeIn_0.3s_ease-out]">
                    {t("Discord conectado com sucesso")}
                  </p>
                )}
                {discordResult === "error" && (
                  <p className="text-red-300 text-xs animate-[fadeIn_0.3s_ease-out]">
                    {discordReason === "already_linked"
                      ? t("Discord ja vinculado")
                      : t("Erro ao conectar Discord")}
                  </p>
                )}

                {user?.discord_connected ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs self-start">
                    <CheckCircleFillIcon size={14} />
                    {t("Discord conectado")}
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <a
                      href="/api/v1/discord/connect"
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#5865F2]/15 hover:bg-[#5865F2]/35 border border-[#5865F2]/40 hover:border-[#5865F2]/70 text-indigo-200 text-xs font-semibold transition-all duration-300 self-start cursor-pointer hover:scale-105 active:scale-95"
                    >
                      <DiscordIcon size={16} />
                      {t("Entrar no Discord")}
                    </a>
                    <p className="text-[11px] text-white/40">
                      {t("Texto beneficio discord")}
                    </p>
                  </div>
                )}

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={wallOptIn}
                    onChange={handleWallOptInChange}
                    disabled={isSaving}
                    className="w-4 h-4 rounded accent-amber-400 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <span className="text-xs">
                    {isSaving
                      ? t("Salvando...")
                      : t("Exibir meu nome no mural")}
                  </span>
                </label>

                {saveError && (
                  <p className="text-red-300 text-xs">{saveError}</p>
                )}

                <Link
                  href="/apoiadores"
                  className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-white/40 hover:text-amber-300 transition-colors"
                >
                  <HeartFillIcon size={12} />
                  {t("Ver mural de apoiadores")}
                </Link>
              </div>
            )}

            {isSupporter && <span className="h-px w-full bg-white/5"></span>}

            {/* Ações de conta */}
            <div className="flex flex-col items-start gap-2">
              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                className="cursor-pointer inline-flex items-center gap-2 text-xs uppercase tracking-widest text-white/40 hover:text-cyan-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PackageIcon size={12} />
                {isExporting ? t("Exportando...") : t("Exportar meus dados")}
              </button>

              {exportError && (
                <p className="text-red-300 text-xs">{exportError}</p>
              )}

              <button
                type="button"
                onClick={() => setIsConfirming(true)}
                className="cursor-pointer inline-flex items-center gap-2 text-xs uppercase tracking-widest text-white/40 hover:text-red-300 transition-colors"
              >
                <TrashIcon size={12} />
                {t("Excluir conta")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
