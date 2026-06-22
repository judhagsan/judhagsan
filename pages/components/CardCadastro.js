import { useState } from "react";
import Link from "next/link";
import {
  CheckCircleFillIcon,
  MailIcon,
  ArrowLeftIcon,
  PersonFillIcon,
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
    <div className="w-full h-auto lg:h-auto">
      <div className="glass-card rounded-[20px] p-6 shadow-2xl relative overflow-hidden flex flex-col h-auto lg:h-auto group transition-all duration-500 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent -z-10 pointer-events-none"></div>

        <div className="shrink-0 mb-4 flex items-center gap-3 relative z-10">
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
          <div className="w-10 h-10 rounded-full bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-500/15 shrink-0">
            <PersonFillIcon size={20} />
          </div>
          <h2 className="text-lg lg:text-xl font-bold tracking-tight text-white/90">
            {t("Cadastro")}
          </h2>
        </div>

        {registeredEmail ? (
          <div className="flex flex-col items-center justify-center text-center gap-3 text-white/70 font-mono text-sm relative z-10 flex-1">
            <div className="w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-200 animate-[fadeIn_0.4s_ease-out]">
              <CheckCircleFillIcon size={24} />
            </div>
            <p className="text-base text-white/90 font-semibold">
              {t("Verifique seu email")}
            </p>
            <p className="text-xs leading-relaxed max-w-xs flex items-start gap-2 justify-center">
              <MailIcon size={14} className="mt-0.5 text-cyan-300 shrink-0" />
              <span>
                {t("Email de ativacao enviado", { email: registeredEmail })}
              </span>
            </p>
            <button
              type="button"
              onClick={() => setRegisteredEmail("")}
              className="cursor-pointer mt-2 text-xs uppercase tracking-widest text-white/50 hover:text-white transition-colors"
            >
              {t("Cadastrar outra conta")}
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 text-white/70 font-mono text-sm relative z-10 flex-1"
          >
            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-widest text-white/50">
                {t("Username")}
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="px-3 py-3 lg:py-2 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-400/60 focus:bg-white/10 outline-none text-white placeholder-white/30 transition-colors text-base lg:text-sm"
                placeholder={t("seu_usuario")}
              />
            </label>

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

            <div className="flex flex-col lg:flex-row gap-3">
              <label className="flex flex-col gap-1 flex-1">
                <span className="text-xs uppercase tracking-widest text-white/50">
                  {t("Senha")}
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  minLength={8}
                  className="px-3 py-3 lg:py-2 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-400/60 focus:bg-white/10 outline-none text-white placeholder-white/30 transition-colors text-base lg:text-sm"
                  placeholder={t("min_char")}
                />
              </label>

              <label className="flex flex-col gap-1 flex-1">
                <span className="text-xs uppercase tracking-widest text-white/50">
                  {t("Confirmar")}
                </span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className={`px-3 py-3 lg:py-2 rounded-xl bg-white/5 border outline-none text-white placeholder-white/30 transition-colors focus:bg-white/10 text-base lg:text-sm ${
                    passwordsMismatch
                      ? "border-red-400/60 focus:border-red-400"
                      : "border-white/10 focus:border-cyan-400/60"
                  }`}
                  placeholder="••••••••"
                />
              </label>
            </div>

            {passwordsMismatch && (
              <p className="text-red-300 text-xs -mt-2">
                {t("As senhas nao conferem")}
              </p>
            )}

            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={privacyAccepted}
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-cyan-400 cursor-pointer shrink-0"
              />
              <span className="text-xs text-white/60 leading-relaxed">
                {t("Li e aceito os")}{" "}
                {onPrivacyClick ? (
                  <button
                    type="button"
                    onClick={onPrivacyClick}
                    className="cursor-pointer text-cyan-300 hover:text-cyan-200 transition-colors"
                  >
                    {t("Termos de Uso")}
                  </button>
                ) : (
                  <Link
                    href="/privacidade"
                    target="_blank"
                    className="text-cyan-300 hover:text-cyan-200 transition-colors"
                  >
                    {t("Termos de Uso")}
                  </Link>
                )}
                .
              </span>
            </label>

            {errorMessage && (
              <p className="text-red-300 text-xs">{errorMessage}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || passwordsMismatch || !privacyAccepted}
              className="cursor-pointer mt-2 px-8 py-3 bg-cyan-500/10 hover:bg-cyan-500/30 border border-cyan-500/30 hover:border-cyan-500/60 text-cyan-200 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-semibold text-base w-full lg:w-auto"
            >
              {isSubmitting ? t("Cadastrando...") : t("Cadastrar")}
            </button>

            <p className="text-xs text-white/50 text-center mt-2">
              {t("Ja tem conta?")}{" "}
              {onLoginClick ? (
                <button
                  type="button"
                  onClick={onLoginClick}
                  className="cursor-pointer text-cyan-300 hover:text-cyan-200 transition-colors"
                >
                  {t("Entrar")}
                </button>
              ) : (
                <Link
                  href="/login"
                  className="text-cyan-300 hover:text-cyan-200 transition-colors"
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
