import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  SignInIcon,
  AlertFillIcon,
  ArrowLeftIcon,
} from "@primer/octicons-react";
import useLanguage from "hooks/useLanguage";

export default function CardLogin({ onCadastroClick, onBack }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/v1/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const responseBody = await response.json();

      if (!response.ok) {
        setErrorMessage(responseBody.message || t("Login falhou"));
        return;
      }

      router.push("/sessao");
    } catch {
      setErrorMessage(t("Erro de conexao"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full h-auto lg:h-auto">
      <div className="glass-card rounded-[20px] p-4 lg:p-5 shadow-2xl relative overflow-hidden flex flex-col h-auto lg:h-auto group transition-all duration-500 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent -z-10 pointer-events-none"></div>

        <div className="shrink-0 mb-3 flex items-center gap-3 relative z-10">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Voltar"
              className="cursor-pointer text-white/50 hover:text-white transition-colors flex items-center justify-center -ml-1 pr-1"
            >
              <ArrowLeftIcon size={18} />
            </button>
          )}
          <div className="w-8 h-8 rounded-full bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-500/15 shrink-0">
            <SignInIcon size={16} />
          </div>
          <h2 className="text-base lg:text-lg font-bold tracking-tight text-white/90">
            {t("Login")}
          </h2>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 text-white/70 font-mono text-sm relative z-10 flex-1"
        >
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-widest text-white/50">
              {t("Email")}
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="px-3 py-3 lg:py-2 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-400/60 focus:bg-white/10 outline-none text-white placeholder-white/30 transition-colors text-base lg:text-sm"
              placeholder="voce@exemplo.com"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-widest text-white/50">
              {t("Senha")}
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="px-3 py-3 lg:py-2 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-400/60 focus:bg-white/10 outline-none text-white placeholder-white/30 transition-colors text-base lg:text-sm"
              placeholder="••••••••"
            />
          </label>

          {errorMessage && (
            <p className="text-red-300 text-xs flex items-start gap-2 animate-[fadeIn_0.3s_ease-out]">
              <AlertFillIcon size={14} className="mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="cursor-pointer mt-2 inline-flex items-center justify-center gap-2 px-8 py-3 bg-cyan-500/10 hover:bg-cyan-500/30 border border-cyan-500/30 hover:border-cyan-500/60 text-cyan-200 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-semibold text-base w-full lg:w-auto"
          >
            <SignInIcon size={18} />
            {isSubmitting ? t("Entrando...") : t("Entrar")}
          </button>

          <p className="text-xs text-white/50 text-center mt-2">
            {t("Nao tem conta?")}{" "}
            {onCadastroClick ? (
              <button
                type="button"
                onClick={onCadastroClick}
                className="cursor-pointer text-cyan-300 hover:text-cyan-200 transition-colors"
              >
                {t("Cadastrar")}
              </button>
            ) : (
              <Link
                href="/cadastro"
                className="text-cyan-300 hover:text-cyan-200 transition-colors"
              >
                {t("Cadastrar")}
              </Link>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
