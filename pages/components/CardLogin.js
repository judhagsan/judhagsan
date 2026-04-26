import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { SignInIcon, AlertFillIcon } from "@primer/octicons-react";

export default function CardLogin() {
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
        setErrorMessage(responseBody.message || "Não foi possível entrar.");
        return;
      }

      router.push("/sessao");
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
          Login
        </h2>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 text-white/70 font-mono text-sm relative z-10 flex-1 h-full"
        >
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

          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-widest text-white/50">
              Senha
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-400/60 focus:bg-white/10 outline-none text-white placeholder-white/30 transition-colors"
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
            className="cursor-pointer mt-2 inline-flex items-center justify-center gap-2 px-8 py-3 bg-cyan-500/10 hover:bg-cyan-500/30 border border-cyan-500/30 hover:border-cyan-500/60 text-cyan-200 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-semibold text-base"
          >
            <SignInIcon size={18} />
            {isSubmitting ? "Entrando..." : "Entrar"}
          </button>

          <p className="text-xs text-white/50 text-center mt-2">
            Não tem conta?{" "}
            <Link
              href="/cadastro"
              className="text-cyan-300 hover:text-cyan-200 transition-colors"
            >
              Cadastrar
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
