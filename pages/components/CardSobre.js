import {
  InfoIcon,
  ArrowLeftIcon,
  PersonIcon,
  CodeIcon,
  HeartIcon,
  VideoIcon,
} from "@primer/octicons-react";
import useLanguage from "hooks/useLanguage";

export default function CardSobre({ onClose }) {
  const { language, t } = useLanguage();

  return (
    <div className="w-full h-auto lg:h-full">
      <div className="glass-card rounded-[20px] p-6 shadow-2xl relative overflow-hidden flex flex-col h-auto lg:h-full group transition-all duration-500 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] animate-[fadeIn_0.3s_ease-out]">
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
            <div className="flex flex-col gap-6">
              <section className="flex flex-col gap-2">
                <h3 className="text-base font-semibold text-white/90 flex items-center gap-2">
                  <PersonIcon size={16} className="text-cyan-300" />
                  About & The Studio
                </h3>
                <div className="text-white/70 leading-relaxed text-sm flex flex-col gap-2">
                  <p>
                    I created{" "}
                    <span className="text-cyan-300 font-semibold">
                      Judhagsan
                    </span>{" "}
                    as my studio and portfolio. My name is{" "}
                    <span className="text-white font-medium">
                      Judhá Guilherme Santos
                    </span>
                    , and working as a freelancer since 2019, I am a computer
                    engineer and animator, merging art and technology to develop
                    interactive solutions and expressive animations.
                  </p>
                </div>
              </section>

              <section className="flex flex-col gap-2">
                <h3 className="text-base font-semibold text-white/90 flex items-center gap-2">
                  <VideoIcon size={16} className="text-cyan-300" />
                  Animation & Motion Design
                </h3>
                <div className="text-white/70 leading-relaxed text-sm flex flex-col gap-2">
                  <p>
                    Production of 2D, 3D, and mixed media animations. Over the
                    years, I have created animation projects and assets for
                    prominent national and global brands, as well as visual
                    content and animations for games across various genres.
                  </p>
                </div>
              </section>

              <section className="flex flex-col gap-2">
                <h3 className="text-base font-semibold text-white/90 flex items-center gap-2">
                  <CodeIcon size={16} className="text-cyan-300" />
                  Technology & Development
                </h3>
                <div className="text-white/70 leading-relaxed text-sm flex flex-col gap-2">
                  <p>
                    Beyond animation, I develop software projects and web
                    interactions. The primary example of this work is{" "}
                    <span className="text-cyan-300 font-semibold">
                      Pindorama
                    </span>
                    , a vector and mixed media animation engine available here
                    on the site.
                  </p>
                </div>
              </section>

              <section className="flex flex-col gap-2">
                <h3 className="text-base font-semibold text-white/90 flex items-center gap-2">
                  <HeartIcon size={16} className="text-cyan-300" />
                  Purpose
                </h3>
                <div className="text-white/70 leading-relaxed text-sm flex flex-col gap-2">
                  <p>
                    My main aspiration is to merge engineering and art, using
                    animation and design as essential links to translate complex
                    concepts into fluid, intuitive, and beautiful interactive
                    experiences.
                  </p>
                </div>
              </section>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <section className="flex flex-col gap-2">
                <h3 className="text-base font-semibold text-white/90 flex items-center gap-2">
                  <PersonIcon size={16} className="text-cyan-300" />
                  Quem Sou & O Estúdio
                </h3>
                <div className="text-white/70 leading-relaxed text-sm flex flex-col gap-2">
                  <p>
                    Criei o{" "}
                    <span className="text-cyan-300 font-semibold">
                      Judhagsan
                    </span>{" "}
                    como meu estúdio e portfólio. Meu nome é{" "}
                    <span className="text-white font-medium">
                      Judhá Guilherme Santos
                    </span>
                    , e atuando como freelancer desde 2019, sou engenheiro da
                    computação e animador, unindo arte e tecnologia para
                    desenvolver soluções interativas e animações expressivas.
                  </p>
                </div>
              </section>

              <section className="flex flex-col gap-2">
                <h3 className="text-base font-semibold text-white/90 flex items-center gap-2">
                  <VideoIcon size={16} className="text-cyan-300" />
                  Animação & Motion Design
                </h3>
                <div className="text-white/70 leading-relaxed text-sm flex flex-col gap-2">
                  <p>
                    Produção de animações 2D, 3D e mixed media. Ao longo dos
                    anos, realizei projetos e materiais de animação para grandes
                    marcas nacionais e globais, além de produzir conteúdo visual
                    e animações para jogos de diversos gêneros.
                  </p>
                </div>
              </section>

              <section className="flex flex-col gap-2">
                <h3 className="text-base font-semibold text-white/90 flex items-center gap-2">
                  <CodeIcon size={16} className="text-cyan-300" />
                  Tecnologia & Desenvolvimento
                </h3>
                <div className="text-white/70 leading-relaxed text-sm flex flex-col gap-2">
                  <p>
                    Além de animação, desenvolvo projetos de software e
                    interações para a web. O principal exemplo desse trabalho é
                    o próprio{" "}
                    <span className="text-cyan-300 font-semibold">
                      Pindorama
                    </span>
                    , uma engine de animação vetorial e mixed media disponível
                    aqui no site.
                  </p>
                </div>
              </section>

              <section className="flex flex-col gap-2">
                <h3 className="text-base font-semibold text-white/90 flex items-center gap-2">
                  <HeartIcon size={16} className="text-cyan-300" />
                  Propósito
                </h3>
                <div className="text-white/70 leading-relaxed text-sm flex flex-col gap-2">
                  <p>
                    Minha principal intenção é unir a engenharia e a arte,
                    utilizando a animação e o design como elos fundamentais para
                    traduzir conceitos complexos em experiências interativas
                    fluidas, intuitivas e belas.
                  </p>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
