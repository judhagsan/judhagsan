import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { HeartFillIcon, CheckCircleFillIcon } from "@primer/octicons-react";
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

export default function CardApoiador({ user }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [wallOptIn, setWallOptIn] = useState(
    user?.supporter_wall_opt_in ?? false,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const discordResult = router.query.discord;
  const discordReason = router.query.reason;

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

  return (
    <div className="w-full h-auto">
      <div className="glass-card rounded-[20px] p-6 shadow-2xl relative overflow-hidden flex flex-col group transition-all duration-500 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] animate-[fadeIn_0.4s_ease-out]">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent -z-10 pointer-events-none"></div>

        {/* Header */}
        <div className="shrink-0 mb-4 flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
            <HeartFillIcon size={18} />
          </div>
          <h2 className="text-lg font-bold tracking-tight text-white/90">
            {t("Apoiador")}
          </h2>
        </div>

        <div className="flex flex-col gap-4 text-sm text-white/70 font-mono relative z-10">
          {/* Feedback do retorno do OAuth do Discord */}
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

          {/* Discord */}
          {user?.discord_connected ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs self-start">
              <CheckCircleFillIcon size={14} />
              {t("Discord conectado")}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <a
                href="/api/v1/discord/connect"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5865F2]/15 hover:bg-[#5865F2]/35 border border-[#5865F2]/40 hover:border-[#5865F2]/70 text-indigo-200 text-xs font-semibold transition-all duration-300 self-start cursor-pointer hover:scale-105 active:scale-95"
              >
                <DiscordIcon size={16} />
                {t("Entrar no Discord")}
              </a>
              <p className="text-[11px] text-white/40">
                {t("Texto beneficio discord")}
              </p>
            </div>
          )}

          {/* Opt-in do mural */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={wallOptIn}
              onChange={handleWallOptInChange}
              disabled={isSaving}
              className="w-4 h-4 rounded accent-amber-400 cursor-pointer disabled:cursor-not-allowed"
            />
            <span className="text-xs">
              {isSaving ? t("Salvando...") : t("Exibir meu nome no mural")}
            </span>
          </label>

          {saveError && <p className="text-red-300 text-xs">{saveError}</p>}

          <Link
            href="/apoiadores"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-white/40 hover:text-amber-300 transition-colors"
          >
            <HeartFillIcon size={12} />
            {t("Ver mural de apoiadores")}
          </Link>
        </div>
      </div>
    </div>
  );
}
