import { useState } from "react";
import Link from "next/link";
import {
  CheckCircleFillIcon,
  MailIcon,
  PersonFillIcon,
  AlertFillIcon,
} from "@primer/octicons-react";
import useLanguage from "hooks/useLanguage";

export default function CardCadastro({ onPrivacyClick, onLoginClick, onBack }) {
  const { t } = useLanguage();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");

  const passwordsMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  async function handleSubmit(event) {
    event.preventDefault();

    if (password.length < 8) {
      setErrorMessage(t("A senha deve ter no minimo 8 caracteres"));
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(t("As senhas nao conferem"));
      return;
    }

    if (!privacyAccepted) {
      setErrorMessage(t("Aceitar termos obrigadorio"));
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/v1/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          password,
          privacy_accepted: privacyAccepted,
        }),
      });

      const responseBody = await response.json();

      if (!response.ok) {
        setErrorMessage(responseBody.message || t("Cadastro falhou"));
        return;
      }

      setRegisteredEmail(email);
      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setPrivacyAccepted(false);
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
          {/* Três botões com o primeiro agindo como voltar */}
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
            <PersonFillIcon size={17} className="shrink-0 text-black" />
            <span className="text-sm lg:text-base font-mono font-bold tracking-wider uppercase text-black">
              {t("Cadastro")}
            </span>
          </div>

          <div
            className="w-20 shrink-0 pointer-events-none"
            aria-hidden="true"
          />
        </div>

        {registeredEmail ? (
          <div className="p-6 flex flex-col items-center justify-center text-center gap-3 font-mono">
            <div className="w-12 h-12 rounded-xl border-2 border-white flex items-center justify-center text-white bg-black">
              <CheckCircleFillIcon size={24} />
            </div>
            <p className="text-sm font-bold uppercase tracking-wider text-white">
              {t("Verifique seu email")}
            </p>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-xs flex items-center gap-2 justify-center">
              <MailIcon size={14} className="shrink-0" />
              <span>
                {t("Email de ativacao enviado", { email: registeredEmail })}
              </span>
            </p>
            <button
              type="button"
              onClick={() => setRegisteredEmail("")}
              className="win-btn mt-4 text-xs"
            >
              {t("Cadastrar outra conta")}
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="p-5 flex flex-col gap-3 font-mono"
          >
            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wider text-zinc-400">
                {t("Username")}
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="win-input rounded-xl text-sm py-2"
                placeholder="usuario"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wider text-zinc-400">
                {t("Email")}
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="win-input rounded-xl text-sm py-2"
                placeholder="usuario@exemplo.com"
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wider text-zinc-400">
                  {t("Senha")}
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  minLength={8}
                  className="win-input rounded-xl text-sm py-2"
                  placeholder={t("min_char")}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wider text-zinc-400">
                  {t("Confirmar")}
                </span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className={`win-input rounded-xl text-sm py-2 ${
                    passwordsMismatch ? "border-red-400" : ""
                  }`}
                  placeholder="••••••••"
                />
              </label>
            </div>

            {passwordsMismatch && (
              <p className="text-red-400 text-xs">
                {t("As senhas nao conferem")}
              </p>
            )}

            <label className="flex items-start gap-2 cursor-pointer select-none mt-1">
              <input
                type="checkbox"
                checked={privacyAccepted}
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                className="mt-0.5 accent-white w-4 h-4 cursor-pointer"
              />
              <span className="text-xs text-zinc-400 leading-relaxed">
                {t("Li e aceito os")}{" "}
                {onPrivacyClick ? (
                  <button
                    type="button"
                    onClick={onPrivacyClick}
                    className="cursor-pointer text-white underline font-semibold"
                  >
                    {t("Termos de Uso")}
                  </button>
                ) : (
                  <Link
                    href="/privacidade"
                    target="_blank"
                    className="text-white underline font-semibold"
                  >
                    {t("Termos de Uso")}
                  </Link>
                )}
                .
              </span>
            </label>

            {errorMessage && (
              <div className="border border-white bg-black rounded-xl p-2 text-xs text-white flex items-start gap-2">
                <AlertFillIcon size={14} className="mt-0.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || passwordsMismatch || !privacyAccepted}
              className="win-btn-primary w-full py-2.5 text-xs mt-2"
            >
              <PersonFillIcon size={16} />
              <span>{isSubmitting ? t("Cadastrando...") : t("Cadastrar")}</span>
            </button>

            <p className="text-xs text-zinc-400 text-center mt-1">
              {t("Ja tem conta?")}{" "}
              {onLoginClick ? (
                <button
                  type="button"
                  onClick={onLoginClick}
                  className="cursor-pointer text-white underline hover:text-zinc-300 font-semibold"
                >
                  {t("Entrar")}
                </button>
              ) : (
                <Link
                  href="/login"
                  className="text-white underline hover:text-zinc-300 font-semibold"
                >
                  {t("Entrar")}
                </Link>
              )}
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
