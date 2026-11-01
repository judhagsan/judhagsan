import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { SignInIcon, AlertFillIcon } from "@primer/octicons-react";
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
    <div className="w-full h-auto">
      <div className="rounded-2xl overflow-hidden border-2 border-white bg-black bg-noise flex flex-col h-auto relative">
        {/* Barra de Título Branca com Texto Preto */}
        <div className="h-10 shrink-0 flex items-center justify-between px-3.5 border-b-2 border-black bg-white text-black select-none">
          {/* Os 3 botões com o primeiro agindo como botão de voltar */}
          <div className="flex items-center gap-2.5 shrink-0">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                aria-label={t("Voltar")}
                title={t("Voltar")}
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
            ) : (
              <span className="w-5 h-5 rounded-full border-2 border-black bg-white shrink-0" />
            )}
            <span className="w-5 h-5 rounded-full bg-black shrink-0" />
            <span className="w-5 h-5 rounded-full bg-black shrink-0" />
          </div>

          <div className="flex items-center gap-2 min-w-0 mx-2">
            <SignInIcon size={17} className="shrink-0 text-black" />
            <span className="text-sm lg:text-base font-mono font-bold tracking-wider uppercase text-black">
              {t("Login")}
            </span>
          </div>

          <div
            className="w-20 shrink-0 pointer-events-none"
            aria-hidden="true"
          />
        </div>

        {/* Formulário */}
        <form
          onSubmit={handleSubmit}
          className="p-5 flex flex-col gap-4 font-mono"
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-xs uppercase tracking-wider text-zinc-400">
              {t("Email")}
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="win-input rounded-xl text-sm py-2.5"
              placeholder="usuario@exemplo.com"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs uppercase tracking-wider text-zinc-400">
              {t("Senha")}
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="win-input rounded-xl text-sm py-2.5"
              placeholder="••••••••"
            />
          </label>

          {errorMessage && (
            <div className="border border-white bg-black rounded-xl p-2.5 text-xs text-white flex items-start gap-2 animate-[fadeIn_0.15s_ease-out]">
              <AlertFillIcon size={14} className="mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="win-btn-primary w-full py-2.5 text-xs mt-2"
          >
            <SignInIcon size={16} />
            <span>{isSubmitting ? t("Entrando...") : t("Entrar")}</span>
          </button>

          <p className="text-xs text-zinc-400 text-center mt-2">
            {t("Nao tem conta?")}{" "}
            {onCadastroClick ? (
              <button
                type="button"
                onClick={onCadastroClick}
                className="cursor-pointer text-white underline hover:text-zinc-300 font-semibold"
              >
                {t("Cadastrar")}
              </button>
            ) : (
              <Link
                href="/cadastro"
                className="text-white underline hover:text-zinc-300 font-semibold"
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
