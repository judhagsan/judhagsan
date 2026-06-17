import {
  InfoIcon,
  ArrowLeftIcon,
  PersonIcon,
  GearIcon,
  HeartIcon,
} from "@primer/octicons-react";
import useLanguage from "hooks/useLanguage";

export default function CardSobre({ onClose }) {
  const { language, t } = useLanguage();

  return (
    <div className="w-full h-auto lg:h-full">
      <div className="glass-card rounded-[20px] p-6 shadow-2xl relative overflow-hidden flex flex-col h-auto lg:h-full group transition-all duration-500 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent -z-10 pointer-events-none"></div>

        {/* Header */}
        <div className="shrink-0 mb-4 flex items-center gap-3 relative z-10">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Voltar"
              className="cursor-pointer text-white/50 hover:text-white transition-colors flex items-center justify-center -ml-1 pr-1"
            >
              <ArrowLeftIcon size={18} />
            </button>
          )}
          <div className="w-10 h-10 rounded-full bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-500/15 shrink-0">
            <InfoIcon size={20} />
          </div>
          <h2 className="text-lg lg:text-xl font-bold tracking-tight text-white/90">
            {t("Sobre")}
          </h2>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-3 relative z-10">
          {language === "en" ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Project Overview */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                <section className="flex flex-col gap-2">
                  <h3 className="text-base font-semibold text-white/90 flex items-center gap-2">
                    <HeartIcon size={16} className="text-cyan-300" />
                    The Project
                  </h3>
                  <div className="text-white/70 leading-relaxed text-sm flex flex-col gap-2">
                    <p>
                      <span className="text-cyan-300 font-semibold">
                        judhagsan.com
                      </span>{" "}
                      is the digital ecosystem created to host the development
                      of{" "}
                      <span className="text-white font-medium">Pindorama</span>,
                      a next-generation animation and mixed media engine. Our
                      main focus is on high performance and integrating
                      traditional 2D vector workflows.
                    </p>
                  </div>
                </section>

                <section className="flex flex-col gap-2">
                  <h3 className="text-base font-semibold text-white/90 flex items-center gap-2">
                    <PersonIcon size={16} className="text-cyan-300" />
                    Philosophy
                  </h3>
                  <div className="text-white/70 leading-relaxed text-sm flex flex-col gap-2">
                    <p>
                      We strive to build lightweight, highly focused, and
                      efficient tools — built &quot;by animators, for
                      animators.&quot; We believe design and creation software
                      should serve human creativity, without forcing technical
                      barriers, complex setups, or requiring high-end hardware.
                    </p>
                  </div>
                </section>

                <section className="flex flex-col gap-2">
                  <h3 className="text-base font-semibold text-white/90 flex items-center gap-2">
                    <GearIcon size={16} className="text-cyan-300" />
                    Open & Transparent
                  </h3>
                  <div className="text-white/70 leading-relaxed text-sm flex flex-col gap-2">
                    <p>
                      Our system is designed with total respect for user
                      privacy. We maintain full transparency regarding system
                      telemetry, operations metrics, and user logs — keeping the
                      platform secure and completely free of invasive tracking
                      or third-party advertising services.
                    </p>
                  </div>
                </section>
              </div>

              {/* Right Column: Tech Specs */}
              <div className="flex flex-col gap-4 bg-black/20 p-4 rounded-xl border border-white/5 h-fit lg:sticky lg:top-0">
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                  Technical Details
                </h3>
                <div className="flex flex-col gap-3 font-mono text-xs text-white/80">
                  <div className="flex flex-col border-b border-white/5 pb-2">
                    <span className="text-white/40 text-[10px] uppercase">
                      Creator
                    </span>
                    <span className="text-cyan-300 text-sm font-medium">
                      Judhagsan
                    </span>
                  </div>
                  <div className="flex flex-col border-b border-white/5 pb-2">
                    <span className="text-white/40 text-[10px] uppercase">
                      Core Software
                    </span>
                    <span className="text-white text-sm font-medium">
                      Pindorama Engine
                    </span>
                  </div>
                  <div className="flex flex-col border-b border-white/5 pb-2">
                    <span className="text-white/40 text-[10px] uppercase">
                      Tech Stack
                    </span>
                    <span className="text-white">
                      Next.js, PostgreSQL, Tailwind, Node.js, Docker
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white/40 text-[10px] uppercase">
                      License
                    </span>
                    <span className="text-white">MIT License</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Coluna Esquerda: Visão Geral */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                <section className="flex flex-col gap-2">
                  <h3 className="text-base font-semibold text-white/90 flex items-center gap-2">
                    <HeartIcon size={16} className="text-cyan-300" />O Projeto
                  </h3>
                  <div className="text-white/70 leading-relaxed text-sm flex flex-col gap-2">
                    <p>
                      O{" "}
                      <span className="text-cyan-300 font-semibold">
                        judhagsan.com
                      </span>{" "}
                      é o ecossistema digital criado para hospedar o
                      desenvolvimento do{" "}
                      <span className="text-white font-medium">Pindorama</span>,
                      uma engine de animação e mixed media de próxima geração
                      focada em alta performance e integração de fluxos
                      tradicionais vetoriais 2D.
                    </p>
                  </div>
                </section>

                <section className="flex flex-col gap-2">
                  <h3 className="text-base font-semibold text-white/90 flex items-center gap-2">
                    <PersonIcon size={16} className="text-cyan-300" />
                    Filosofia
                  </h3>
                  <div className="text-white/70 leading-relaxed text-sm flex flex-col gap-2">
                    <p>
                      Buscamos desenvolver ferramentas leves, focadas e
                      eficientes, feitas &quot;de animador para animador&quot;.
                      Acreditamos que o software deve servir à criatividade sem
                      impor barreiras técnicas, configurações complexas ou
                      exigir hardware topo de linha para projetos densos.
                    </p>
                  </div>
                </section>

                <section className="flex flex-col gap-2">
                  <h3 className="text-base font-semibold text-white/90 flex items-center gap-2">
                    <GearIcon size={16} className="text-cyan-300" />
                    Aberto & Transparente
                  </h3>
                  <div className="text-white/70 leading-relaxed text-sm flex flex-col gap-2">
                    <p>
                      Nosso sistema foi projetado respeitando a privacidade dos
                      usuários. Mantemos total transparência sobre a telemetria
                      do sistema, métricas de funcionamento e logs de ações —
                      sendo a plataforma segura e livre de rastreamento invasivo
                      ou anúncios.
                    </p>
                  </div>
                </section>
              </div>

              {/* Coluna Direita: Ficha Técnica */}
              <div className="flex flex-col gap-4 bg-black/20 p-4 rounded-xl border border-white/5 h-fit lg:sticky lg:top-0">
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                  Ficha Técnica
                </h3>
                <div className="flex flex-col gap-3 font-mono text-xs text-white/80">
                  <div className="flex flex-col border-b border-white/5 pb-2">
                    <span className="text-white/40 text-[10px] uppercase">
                      Criador
                    </span>
                    <span className="text-cyan-300 text-sm font-medium">
                      Judhagsan
                    </span>
                  </div>
                  <div className="flex flex-col border-b border-white/5 pb-2">
                    <span className="text-white/40 text-[10px] uppercase">
                      Software Principal
                    </span>
                    <span className="text-white text-sm font-medium">
                      Pindorama Engine
                    </span>
                  </div>
                  <div className="flex flex-col border-b border-white/5 pb-2">
                    <span className="text-white/40 text-[10px] uppercase">
                      Tecnologias
                    </span>
                    <span className="text-white">
                      Next.js, PostgreSQL, Tailwind, Node.js, Docker
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white/40 text-[10px] uppercase">
                      Licença
                    </span>
                    <span className="text-white">Licença MIT</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
