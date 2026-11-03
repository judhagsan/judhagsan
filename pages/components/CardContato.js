import { useState } from "react";
import {
  MailIcon,
  CommentDiscussionIcon,
  QuestionIcon,
  ShieldIcon,
  SyncIcon,
  CheckCircleFillIcon,
  AlertFillIcon,
} from "@primer/octicons-react";
import useLanguage from "hooks/useLanguage";
import CardNormal from "./CardNormal";

function Section({ icon: Icon, title, children }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
        <Icon size={14} className="text-white shrink-0" />
        <span>{title}</span>
      </h3>
      <div className="text-zinc-400 leading-relaxed text-sm flex flex-col gap-2">
        {children}
      </div>
    </section>
  );
}

export default function CardContato({ onClose }) {
  const { language, t } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle");
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
        setErrorMessage(data.message || t("Erro ao enviar mensagem"));
        setStatus("error");
        return;
      }

      setStatus("success");
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setErrorMessage(t("Erro conexao contato"));
      setStatus("error");
    }
  }

  return (
    <CardNormal
      title={t("Contato")}
      icon={CommentDiscussionIcon}
      onBack={onClose}
      className="lg:h-full card-enter"
      bodyClassName="p-4 lg:p-6 flex-1 min-h-0 overflow-y-auto pr-3"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário (2/3 da largura no desktop) */}
        <div className="lg:col-span-2 flex flex-col justify-start">
          {status === "success" ? (
            <div className="flex flex-col items-center justify-center text-center p-6 gap-3 text-white text-sm flex-1 h-full min-h-[300px] border border-white bg-black animate-[fadeIn_0.2s_ease-out]">
              <div className="w-12 h-12 border-2 border-white flex items-center justify-center text-white bg-black">
                <CheckCircleFillIcon size={24} />
              </div>
              <p className="text-lg font-bold uppercase tracking-wider text-white">
                {t("Mensagem enviada!")}
              </p>
              <p className="text-sm text-zinc-400 leading-relaxed max-w-xs">
                {t("Sucesso ao enviar mensagem")}
              </p>
              <button
                type="button"
                onClick={() => setStatus("idle")}
                className="win-btn mt-4 text-sm"
              >
                {t("Enviar outra mensagem")}
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 text-white text-sm"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm uppercase tracking-wider text-zinc-400">
                    {t("Nome")}
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={status === "loading"}
                    className="win-input"
                    placeholder={t("Seu nome")}
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-sm uppercase tracking-wider text-zinc-400">
                    {t("Email")}
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={status === "loading"}
                    className="win-input"
                    placeholder="voce@exemplo.com"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm uppercase tracking-wider text-zinc-400">
                  {t("Mensagem")}
                </span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={8}
                  disabled={status === "loading"}
                  className="win-input resize-none"
                  placeholder={t("Escreva sua mensagem aqui...")}
                />
              </label>

              {status === "error" && (
                <div className="border border-white bg-black p-2 text-sm text-white flex items-start gap-2">
                  <AlertFillIcon size={14} className="mt-0.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="win-btn-primary w-full md:w-auto self-start py-2.5 text-sm"
              >
                {status === "loading" ? (
                  <>
                    <SyncIcon size={14} className="animate-spin" />
                    <span>{t("Enviando...")}</span>
                  </>
                ) : (
                  <>
                    <MailIcon size={14} />
                    <span>{t("Enviar mensagem")}</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Informações da Direita (1/3 da largura no desktop) */}
        <div className="flex flex-col gap-6 lg:border-l lg:border-zinc-800 lg:pl-6">
          {language === "en" ? (
            <>
              <Section icon={QuestionIcon} title="General questions">
                <p>
                  For questions regarding the website, the{" "}
                  <span className="text-white font-bold underline">
                    Pindorama
                  </span>{" "}
                  software, or partnerships, send an email through the form or
                  directly to{" "}
                  <a
                    href="mailto:contato@judhagsan.com"
                    className="text-white underline hover:text-zinc-400 transition-colors inline-flex items-center gap-1 font-semibold"
                  >
                    <MailIcon size={12} />
                    contato@judhagsan.com
                  </a>
                  .
                </p>
                <p>We will respond within 5 business days.</p>
              </Section>

              <Section icon={ShieldIcon} title="Security vulnerabilities">
                <p>
                  If you found a security vulnerability in the website or in
                  Pindorama, please report it{" "}
                  <span className="text-white font-bold">privately</span> to{" "}
                  <a
                    href="mailto:contato@judhagsan.com?subject=Security%20-%20Vulnerability"
                    className="text-white underline hover:text-zinc-400 transition-colors inline-flex items-center gap-1 font-semibold"
                  >
                    <MailIcon size={12} />
                    contato@judhagsan.com
                  </a>{" "}
                  with the subject{" "}
                  <span className="text-white font-bold">
                    &quot;Security - Vulnerability&quot;
                  </span>
                  .
                </p>
                <p>
                  We ask you{" "}
                  <span className="text-white font-bold">
                    not to disclose publicly
                  </span>{" "}
                  before we have a chance to patch it.
                </p>
              </Section>
            </>
          ) : (
            <>
              <Section icon={QuestionIcon} title="Dúvidas gerais">
                <p>
                  Para perguntas sobre o site, o software{" "}
                  <span className="text-white font-bold underline">
                    Pindorama
                  </span>{" "}
                  ou parcerias, envie o email pelo formulário ou diretamente
                  para o email{" "}
                  <a
                    href="mailto:contato@judhagsan.com"
                    className="text-white underline hover:text-zinc-400 transition-colors inline-flex items-center gap-1 font-semibold"
                  >
                    <MailIcon size={12} />
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
                  <span className="text-white font-bold">privada</span> para{" "}
                  <a
                    href="mailto:contato@judhagsan.com?subject=Security%20-%20Vulnerabilidade"
                    className="text-white underline hover:text-zinc-400 transition-colors inline-flex items-center gap-1 font-semibold"
                  >
                    <MailIcon size={12} />
                    contato@judhagsan.com
                  </a>{" "}
                  com o assunto{" "}
                  <span className="text-white font-bold">
                    &quot;Security - Vulnerabilidade&quot;
                  </span>
                  .
                </p>
                <p>
                  Pedimos para{" "}
                  <span className="text-white font-bold">
                    não divulgar publicamente
                  </span>{" "}
                  antes de termos chance de corrigir.
                </p>
              </Section>
            </>
          )}
        </div>
      </div>
    </CardNormal>
  );
}
