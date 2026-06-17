import {
  BriefcaseIcon,
  ArrowLeftIcon,
  FlameIcon,
  RocketIcon,
  VideoIcon,
} from "@primer/octicons-react";
import useLanguage from "hooks/useLanguage";

export default function CardPortfolio({ onClose }) {
  const { language, t } = useLanguage();

  return (
    <div className="w-full h-auto lg:h-full">
      <div className="glass-card rounded-[20px] p-6 shadow-2xl relative overflow-hidden flex flex-col h-auto lg:h-full group transition-all duration-500 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent -z-10 pointer-events-none"></div>

        {/* Header */}
        <div className="shrink-0 mb-4 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label={t("Voltar")}
                className="cursor-pointer text-white/50 hover:text-white transition-colors flex items-center justify-center -ml-1 pr-1"
              >
                <ArrowLeftIcon size={18} />
              </button>
            )}
            <div className="w-10 h-10 rounded-full bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-500/15 shrink-0">
              <BriefcaseIcon size={20} />
            </div>
            <h2 className="text-lg lg:text-xl font-bold tracking-tight text-white/90">
              {t("Portfolio")}
            </h2>
          </div>

          {/* Badge "Coming Soon" */}
          <span className="text-[10px] lg:text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 animate-pulse">
            {t("Em Breve")}
          </span>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-3 relative z-10 flex flex-col gap-6">
          <p className="text-white/70 leading-relaxed text-sm">
            {t("portfolio_desc")}
          </p>

          {/* Planned Sections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            {/* Box 1 */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex flex-col gap-3 transition-colors hover:bg-white/[0.04]">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <VideoIcon size={16} />
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="text-sm font-semibold text-white/90">
                  {language === "en" ? "Mixed Media" : "Mixed Media"}
                </h4>
                <p className="text-xs text-white/50 leading-relaxed">
                  {language === "en"
                    ? "Hybrid projects combining traditional frame-by-frame drawing with vector deformers."
                    : "Projetos híbridos unindo desenho tradicional quadro a quadro com deformadores vetoriais."}
                </p>
              </div>
            </div>

            {/* Box 2 */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex flex-col gap-3 transition-colors hover:bg-white/[0.04]">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <RocketIcon size={16} />
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="text-sm font-semibold text-white/90">
                  {language === "en" ? "Tech Demos" : "Demos Técnicas"}
                </h4>
                <p className="text-xs text-white/50 leading-relaxed">
                  {language === "en"
                    ? "Case studies on high-performance rendering, CPU/GPU optimization, and export pipelines."
                    : "Estudos de caso sobre renderização de alta performance, otimização de CPU/GPU e exportação."}
                </p>
              </div>
            </div>

            {/* Box 3 */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex flex-col gap-3 transition-colors hover:bg-white/[0.04]">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <FlameIcon size={16} />
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="text-sm font-semibold text-white/90">
                  {language === "en"
                    ? "Art Experiments"
                    : "Arte & Experimentação"}
                </h4>
                <p className="text-xs text-white/50 leading-relaxed">
                  {language === "en"
                    ? "Curated short films, loops, and visual experiences created by guest artists."
                    : "Curadoria de curtas-metragens, loops e experimentações visuais criadas por artistas convidados."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
