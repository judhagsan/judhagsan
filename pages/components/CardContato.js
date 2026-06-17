import { useState } from "react";
import {
  MailIcon,
  CommentDiscussionIcon,
  QuestionIcon,
  ShieldIcon,
  XIcon,
  SyncIcon,
  CheckCircleFillIcon,
  AlertFillIcon,
} from "@primer/octicons-react";

function Section({ icon: Icon, title, children }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-base font-semibold text-white/90 flex items-center gap-2">
        <Icon size={16} className="text-cyan-300" />
        {title}
      </h3>
      <div className="text-white/70 leading-relaxed text-sm flex flex-col gap-2">
        {children}
      </div>
    </section>
  );
}

export default function CardContato({ onClose }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle"); // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/v1/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, message }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(
          data.message || "Ocorreu um erro ao enviar a mensagem.",
        );
        setStatus("error");
        return;
      }

      setStatus("success");
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setErrorMessage(
        "Erro de conexão. Verifique se você está online e tente novamente.",
      );
      setStatus("error");
    }
  }

  return (
    <div className="w-full h-full">
      <div className="glass-card rounded-[20px] p-6 shadow-2xl relative overflow-hidden flex flex-col h-full group transition-all duration-500 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent -z-10 pointer-events-none"></div>

        {/* Header */}
        <div className="shrink-0 mb-5 flex items-center justify-between gap-4 relative z-10">
          <h2 className="text-lg lg:text-xl font-semibold text-white/90 flex items-center gap-2">
            <CommentDiscussionIcon size={20} className="text-cyan-300" />
            Contato
          </h2>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="cursor-pointer text-red-400 hover:text-red-300 transition-colors shrink-0"
            >
              <XIcon size={16} />
            </button>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-3 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Form (2/3 width on desktop) */}
            <div className="lg:col-span-2 flex flex-col justify-start">
              {status === "success" ? (
                <div className="flex flex-col items-center justify-center text-center p-6 gap-3 text-white/70 font-mono text-sm flex-1 h-full min-h-[300px] border border-cyan-500/10 rounded-2xl bg-cyan-950/10 animate-[fadeIn_0.3s_ease-out]">
                  <div className="w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-200 animate-[fadeIn_0.4s_ease-out]">
                    <CheckCircleFillIcon size={24} />
                  </div>
                  <p className="text-base text-white/90 font-semibold">
                    Mensagem enviada!
                  </p>
                  <p className="text-xs leading-relaxed max-w-xs">
                    Sua mensagem foi entregue com sucesso. Responderemos o mais
                    breve possível.
                  </p>
                  <button
                    type="button"
                    onClick={() => setStatus("idle")}
                    className="cursor-pointer mt-4 inline-flex items-center gap-2 px-6 py-2.5 bg-cyan-500/10 hover:bg-cyan-500/30 border border-cyan-500/30 hover:border-cyan-500/60 text-cyan-200 rounded-xl transition-all duration-300 active:scale-95 font-semibold text-sm"
                  >
                    Enviar outra mensagem
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-4 text-white/70 font-mono text-sm"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs uppercase tracking-widest text-white/50">
                        Nome
                      </span>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={status === "loading"}
                        className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-400/60 focus:bg-white/10 outline-none text-white placeholder-white/30 transition-colors text-sm"
                        placeholder="Seu nome"
                      />
                    </label>

                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs uppercase tracking-widest text-white/50">
                        Email
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={status === "loading"}
                        className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-400/60 focus:bg-white/10 outline-none text-white placeholder-white/30 transition-colors text-sm"
                        placeholder="voce@exemplo.com"
                      />
                    </label>
                  </div>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs uppercase tracking-widest text-white/50">
                      Mensagem
                    </span>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      rows={8}
                      disabled={status === "loading"}
                      className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-400/60 focus:bg-white/10 outline-none text-white placeholder-white/30 transition-colors text-sm resize-none"
                      placeholder="Escreva sua mensagem aqui..."
                    />
                  </label>

                  {status === "error" && (
                    <p className="text-red-300 text-xs flex items-start gap-2 animate-[fadeIn_0.3s_ease-out]">
                      <AlertFillIcon size={14} className="mt-0.5 shrink-0" />
                      <span>{errorMessage}</span>
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="cursor-pointer mt-2 inline-flex items-center justify-center gap-2 px-8 py-3 bg-cyan-500/10 hover:bg-cyan-500/30 border border-cyan-500/30 hover:border-cyan-500/60 text-cyan-200 rounded-xl transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-semibold text-sm w-full md:w-auto self-start"
                  >
                    {status === "loading" ? (
                      <>
                        <SyncIcon size={16} className="animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <MailIcon size={16} />
                        Enviar mensagem
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Right Column: Info (1/3 width on desktop) */}
            <div className="flex flex-col gap-6 lg:border-l lg:border-white/10 lg:pl-6">
              <Section icon={QuestionIcon} title="Dúvidas gerais">
                <p>
                  Para perguntas sobre o site, o software{" "}
                  <span className="text-cyan-300">Pindorama</span> ou parcerias,
                  envie o email pelo formulário ou diretamente para o email{" "}
                  <a
                    href="mailto:contato@judhagsan.com"
                    className="text-cyan-300 hover:text-cyan-200 transition-colors inline-flex items-center gap-1"
                  >
                    <MailIcon size={14} />
                    contato@judhagsan.com
                  </a>
                  .
                </p>
                <p>Responderemos em até 5 dias úteis.</p>
              </Section>

              <Section icon={ShieldIcon} title="Vulnerabilidades de segurança">
                <p>
                  Se você encontrou uma vulnerabilidade de segurança no site ou
                  no Pindorama, por favor reporte de forma{" "}
                  <span className="text-white/90">privada</span> para{" "}
                  <a
                    href="mailto:contato@judhagsan.com?subject=Security%20-%20Vulnerabilidade"
                    className="text-cyan-300 hover:text-cyan-200 transition-colors inline-flex items-center gap-1"
                  >
                    <MailIcon size={14} />
                    contato@judhagsan.com
                  </a>{" "}
                  com o assunto{" "}
                  <span className="text-white/90">
                    &quot;Security - Vulnerabilidade&quot;
                  </span>
                  .
                </p>
                <p>
                  Pedimos para{" "}
                  <span className="text-white/90">
                    não divulgar publicamente
                  </span>{" "}
                  antes de termos chance de corrigir.
                </p>
              </Section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
