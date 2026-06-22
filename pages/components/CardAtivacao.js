import { useEffect, useState } from "react";
import Link from "next/link";
import {
  SyncIcon,
  CheckCircleFillIcon,
  AlertFillIcon,
  SignInIcon,
} from "@primer/octicons-react";
import useLanguage from "hooks/useLanguage";

export default function CardAtivacao({ tokenId }) {
  const { t } = useLanguage();
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!tokenId) return;

    let cancelled = false;

    async function activate() {
      try {
        const response = await fetch(`/api/v1/activations/${tokenId}`, {
          method: "PATCH",
        });

        const responseBody = await response.json();
        if (cancelled) return;

        if (!response.ok) {
          setErrorMessage(responseBody.message || t("Ativacao falhou"));
          setStatus("error");
          return;
        }

        setStatus("success");
      } catch {
        if (cancelled) return;
        setErrorMessage(t("Erro de conexao"));
        setStatus("error");
      }
    }

    activate();

    return () => {
      cancelled = true;
    };
  }, [tokenId]);

  return (
    <div className="w-full h-auto lg:h-full">
      <div className="glass-card rounded-[20px] p-6 shadow-2xl relative overflow-hidden flex flex-col h-auto lg:h-full group transition-all duration-500 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent -z-10 pointer-events-none"></div>

        {/* Header */}
        <div className="shrink-0 mb-4 flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-full bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-500/15 shrink-0">
            <CheckCircleFillIcon size={20} />
          </div>
          <h2 className="text-lg lg:text-xl font-bold tracking-tight text-white/90">
            {t("Ativacao")}
          </h2>
        </div>

        <div className="flex flex-col items-center justify-center text-center gap-3 text-white/70 font-mono text-sm relative z-10 flex-1 h-full">
          {status === "loading" && (
            <>
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-cyan-300 animate-spin">
                <SyncIcon size={24} />
              </div>
              <p className="text-base text-white/90 font-semibold">
                {t("Ativando sua conta...")}
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-200 animate-[fadeIn_0.4s_ease-out]">
                <CheckCircleFillIcon size={24} />
              </div>
              <p className="text-base text-white/90 font-semibold">
                {t("Conta ativada!")}
              </p>
              <p className="text-xs leading-relaxed max-w-xs">
                {t("Sucesso ativacao")}
              </p>
              <Link
                href="/login"
                className="cursor-pointer mt-2 inline-flex items-center gap-2 px-8 py-3 bg-cyan-500/10 hover:bg-cyan-500/30 border border-cyan-500/30 hover:border-cyan-500/60 text-cyan-200 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95 font-semibold text-base"
              >
                <SignInIcon size={18} />
                {t("Entrar")}
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-400/40 flex items-center justify-center text-red-200 animate-[fadeIn_0.4s_ease-out]">
                <AlertFillIcon size={24} />
              </div>
              <p className="text-base text-white/90 font-semibold">
                {t("Ativacao falhou")}
              </p>
              <p className="text-xs leading-relaxed max-w-xs text-red-300">
                {errorMessage}
              </p>
              <Link
                href="/cadastro"
                className="cursor-pointer mt-2 text-xs uppercase tracking-widest text-white/50 hover:text-white transition-colors"
              >
                {t("Voltar ao cadastro")}
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
