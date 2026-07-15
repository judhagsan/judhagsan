import { useState } from "react";
import { HeartFillIcon, CheckCircleFillIcon } from "@primer/octicons-react";
import useLanguage from "hooks/useLanguage";

const MONTHLY_PRICE_LABEL = "R$ 9,90";
const ADVANTAGES = ["Vantagem selo", "Vantagem discord", "Vantagem mural"];

export default function CardApoiar() {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubscribe() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/v1/support/subscription", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const body = await response.json();
      if (!response.ok || !body.url) {
        setError(body.message || t("Erro ao iniciar apoio"));
        return;
      }
      window.location.href = body.url;
    } catch {
      setError(t("Erro de conexao"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Shell t={t}>
      {/* Vantagens | valor, com aviso de renovação embaixo */}
      <div className="flex flex-col gap-2 animate-[fadeIn_0.2s_ease-out]">
        <div className="grid grid-cols-2 gap-4">
          {/* Vantagens */}
          <div>
            <span className="text-[10px] uppercase tracking-widest text-amber-300/70 font-semibold">
              {t("Vantagens de apoiador")}
            </span>
            <ul className="mt-1.5 flex flex-col gap-1">
              {ADVANTAGES.map((key) => (
                <li
                  key={key}
                  className="flex items-center gap-2 text-sm leading-tight text-white/85"
                >
                  <CheckCircleFillIcon
                    size={14}
                    className="text-amber-400/70 shrink-0"
                  />
                  {t(key)}
                </li>
              ))}
            </ul>
          </div>

          {/* Valor */}
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-4xl font-bold text-white leading-none">
              {MONTHLY_PRICE_LABEL}
              <span className="text-lg font-semibold text-white/50">
                {t("sufixo mes")}
              </span>
            </span>
          </div>
        </div>
        <p className="text-sm text-white/50 leading-snug">
          {t("Texto mensal curto")}
        </p>
      </div>

      {error && <p className="text-red-300 text-xs mt-2">{error}</p>}

      <button
        type="button"
        onClick={handleSubscribe}
        disabled={isSubmitting}
        className="mt-4 w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/30 border border-amber-400/40 hover:border-amber-400/70 text-amber-100 font-semibold transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        <HeartFillIcon size={16} />
        {isSubmitting ? t("Processando...") : t("Assinar apoio mensal")}
      </button>

      <p className="text-sm text-white/60 text-center mt-3 leading-snug">
        {t("Texto redirect cartao")}
      </p>
    </Shell>
  );
}

function Shell({ t, children }) {
  return (
    <div className="w-full">
      <div className="glass-card rounded-[20px] p-5 shadow-2xl relative overflow-hidden flex flex-col animate-[fadeIn_0.3s_ease-out]">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent -z-10 pointer-events-none"></div>
        <div className="shrink-0 mb-3 flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
            <HeartFillIcon size={18} />
          </div>
          <h2 className="text-lg font-bold tracking-tight text-white/90">
            {t("Apoiar o Pindorama")}
          </h2>
        </div>
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
}
