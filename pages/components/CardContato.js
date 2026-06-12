import {
  MailIcon,
  CommentDiscussionIcon,
  QuestionIcon,
  ShieldIcon,
  XIcon,
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
  return (
    <div className="w-full h-full">
      <div className="glass-card rounded-[20px] p-6 shadow-2xl relative overflow-hidden flex flex-col h-full group transition-all duration-500 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent -z-10 pointer-events-none"></div>

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

        <div className="flex-1 min-h-0 overflow-y-auto pr-3 relative z-10 flex flex-col gap-6">
          <Section icon={QuestionIcon} title="Dúvidas gerais">
            <p>
              Para perguntas sobre o site, o software{" "}
              <span className="text-cyan-300">Pindorama</span> ou parcerias,
              envie um email para{" "}
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
              Se você encontrou uma vulnerabilidade de segurança no site ou no
              Pindorama, por favor reporte de forma{" "}
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
              <span className="text-white/90">não divulgar publicamente</span>{" "}
              antes de termos chance de corrigir.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
