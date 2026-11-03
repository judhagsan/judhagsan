import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { SignInIcon, AlertFillIcon } from "@primer/octicons-react";
import useLanguage from "hooks/useLanguage";
import CardNormal from "./CardNormal";

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
    <CardNormal
      title={t("Login")}
      icon={SignInIcon}
      onBack={onBack}
      bodyClassName="p-5"
    >
      {/* Formulário */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm uppercase tracking-wider text-zinc-400">
            {t("Email")}
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="win-input rounded-xl py-2.5"
            placeholder="usuario@exemplo.com"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm uppercase tracking-wider text-zinc-400">
            {t("Senha")}
          </span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="win-input rounded-xl py-2.5"
            placeholder="••••••••"
          />
        </label>

        {errorMessage && (
          <div className="border border-white bg-black rounded-xl p-2.5 text-sm text-white flex items-start gap-2 animate-[fadeIn_0.15s_ease-out]">
            <AlertFillIcon size={14} className="mt-0.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="win-btn-primary w-full py-2.5 text-sm mt-2"
        >
          <SignInIcon size={16} />
          <span>{isSubmitting ? t("Entrando...") : t("Entrar")}</span>
        </button>

        <p className="text-sm text-zinc-400 text-center mt-2">
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
    </CardNormal>
  );
}
