import { useEffect, useState } from "react";
import Link from "next/link";
import {
  SyncIcon,
  CheckCircleFillIcon,
  AlertFillIcon,
  SignInIcon,
} from "@primer/octicons-react";

export default function CardAtivacao({ tokenId }) {
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
          setErrorMessage(
            responseBody.message || "Não foi possível ativar a conta.",
          );
          setStatus("error");
          return;
        }

        setStatus("success");
      } catch {
        if (cancelled) return;
        setErrorMessage("Erro de conexão. Tente novamente.");
        setStatus("error");
      }
    }

    activate();

    return () => {
      cancelled = true;
    };
  }, [tokenId]);

  return (
    <div className="w-full h-full">
      <div className="glass-card rounded-[35px] p-6 shadow-2xl relative overflow-hidden flex flex-col h-full group transition-all duration-500 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent -z-10 pointer-events-none"></div>

        <h2 className="text-xl font-semibold text-white/90 mb-6 flex items-center gap-2 relative z-10">
          Ativação
        </h2>

        <div className="flex flex-col items-center justify-center text-center gap-3 text-white/70 font-mono text-sm relative z-10 flex-1 h-full">
          {status === "loading" && (
            <>
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-cyan-300 animate-spin">
                <SyncIcon size={24} />
              </div>
              <p className="text-base text-white/90 font-semibold">
                Ativando sua conta...
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-200 animate-[fadeIn_0.4s_ease-out]">
                <CheckCircleFillIcon size={24} />
              </div>
              <p className="text-base text-white/90 font-semibold">
                Conta ativada!
              </p>
              <p className="text-xs leading-relaxed max-w-xs">
                Sua conta foi ativada com sucesso. Agora você já pode entrar.
              </p>
              <Link
                href="/login"
                className="cursor-pointer mt-2 inline-flex items-center gap-2 px-8 py-3 bg-cyan-500/10 hover:bg-cyan-500/30 border border-cyan-500/30 hover:border-cyan-500/60 text-cyan-200 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95 font-semibold text-base"
              >
                <SignInIcon size={18} />
                Entrar
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-400/40 flex items-center justify-center text-red-200 animate-[fadeIn_0.4s_ease-out]">
                <AlertFillIcon size={24} />
              </div>
              <p className="text-base text-white/90 font-semibold">
                Ativação falhou
              </p>
              <p className="text-xs leading-relaxed max-w-xs text-red-300">
                {errorMessage}
              </p>
              <Link
                href="/cadastro"
                className="cursor-pointer mt-2 text-xs uppercase tracking-widest text-white/50 hover:text-white transition-colors"
              >
                Voltar ao cadastro
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
