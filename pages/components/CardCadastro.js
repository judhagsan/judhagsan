import { useState } from "react";
import Link from "next/link";
import { CheckCircleFillIcon, MailIcon } from "@primer/octicons-react";

export default function CardCadastro() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");

  const passwordsMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  async function handleSubmit(event) {
    event.preventDefault();

    if (password !== confirmPassword) {
      setErrorMessage("As senhas não conferem.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/v1/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const responseBody = await response.json();

      if (!response.ok) {
        setErrorMessage(responseBody.message || "Não foi possível cadastrar.");
        return;
      }

      setRegisteredEmail(email);
      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setErrorMessage("Erro de conexão. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full h-full">
      <div className="glass-card rounded-[35px] p-6 shadow-2xl relative overflow-hidden flex flex-col h-full group transition-all duration-500 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent -z-10 pointer-events-none"></div>

        <h2 className="text-xl font-semibold text-white/90 mb-6 flex items-center gap-2 relative z-10">
          Cadastro
        </h2>

        {registeredEmail ? (
          <div className="flex flex-col items-center justify-center text-center gap-3 text-white/70 font-mono text-sm relative z-10 flex-1 h-full">
            <div className="w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-200 animate-[fadeIn_0.4s_ease-out]">
              <CheckCircleFillIcon size={24} />
            </div>
            <p className="text-base text-white/90 font-semibold">
              Conta criada!
            </p>
            <p className="text-xs leading-relaxed max-w-xs flex items-start gap-2 justify-center">
              <MailIcon size={14} className="mt-0.5 text-cyan-300 shrink-0" />
              <span>
                Enviamos um link de ativação para{" "}
                <span className="text-cyan-300">{registeredEmail}</span>.
                Confira sua caixa de entrada para ativar seu cadastro.
              </span>
            </p>
            <button
              type="button"
              onClick={() => setRegisteredEmail("")}
              className="cursor-pointer mt-2 text-xs uppercase tracking-widest text-white/50 hover:text-white transition-colors"
            >
              Cadastrar outra conta
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 text-white/70 font-mono text-sm relative z-10 flex-1 h-full"
          >
            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-widest text-white/50">
                Username
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-400/60 focus:bg-white/10 outline-none text-white placeholder-white/30 transition-colors"
                placeholder="seu_usuario"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-widest text-white/50">
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-400/60 focus:bg-white/10 outline-none text-white placeholder-white/30 transition-colors"
                placeholder="voce@exemplo.com"
              />
            </label>

            <div className="flex gap-3">
              <label className="flex flex-col gap-1 flex-1">
                <span className="text-xs uppercase tracking-widest text-white/50">
                  Senha
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-400/60 focus:bg-white/10 outline-none text-white placeholder-white/30 transition-colors"
                  placeholder="••••••••"
                />
              </label>

              <label className="flex flex-col gap-1 flex-1">
                <span className="text-xs uppercase tracking-widest text-white/50">
                  Confirmar
                </span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className={`px-3 py-2 rounded-xl bg-white/5 border outline-none text-white placeholder-white/30 transition-colors focus:bg-white/10 ${
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
                As senhas não conferem.
              </p>
            )}

            {errorMessage && (
              <p className="text-red-300 text-xs">{errorMessage}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || passwordsMismatch}
              className="cursor-pointer mt-2 px-8 py-3 bg-cyan-500/10 hover:bg-cyan-500/30 border border-cyan-500/30 hover:border-cyan-500/60 text-cyan-200 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-semibold text-base"
            >
              {isSubmitting ? "Cadastrando..." : "Cadastrar"}
            </button>

            <p className="text-xs text-white/50 text-center mt-2">
              Já tem conta?{" "}
              <Link
                href="/login"
                className="text-cyan-300 hover:text-cyan-200 transition-colors"
              >
                Entrar
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
