import Link from "next/link";
import { DownloadIcon } from "@primer/octicons-react";

export default function CardPindorama({ onDownloadClick }) {
  return (
    <div className="w-full h-auto lg:h-auto">
      <div className="glass-card rounded-[20px] p-6 shadow-2xl relative overflow-hidden flex flex-col h-auto lg:h-auto">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent -z-10"></div>

        {/* Header */}
        <div className="shrink-0 mb-4 flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-full bg-yellow-500/30 border border-yellow-400/40 flex items-center justify-center text-yellow-300 shadow-lg shadow-yellow-400/25 shrink-0">
            <img
              src="/PinLogo.svg"
              alt="PinLogo"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <h2 className="text-lg lg:text-xl font-bold tracking-tight text-white/90">
            Pindorama
          </h2>
        </div>

        {/* Content - Centered in remaining space */}
        <div className="flex-1 flex flex-col items-center justify-center text-center mt-4 mb-2">
          <p className="text-zinc-300 mb-6 lg:mb-10 max-w-2xl leading-relaxed text-base lg:text-lg font-medium">
            Desenvolvido de animador para animador. Combine a arte do
            frame-a-frame com a eficiência da animação 2D vetorial. Uma engine
            poderosa para mixed media, otimizada para entregar máxima
            performance respeitando o seu hardware.
          </p>

          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-wrap gap-3 lg:gap-4 justify-center">
              {/* Download (opens login card) */}
              {onDownloadClick ? (
                <button
                  type="button"
                  onClick={onDownloadClick}
                  className="cursor-pointer flex items-center gap-3 px-8 py-3 bg-cyan-500/10 hover:bg-cyan-500/30 border border-cyan-500/30 hover:border-cyan-500/60 text-cyan-200 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95 group"
                >
                  <DownloadIcon
                    size={20}
                    className="group-hover:text-cyan-400 transition-colors"
                  />
                  <span className="font-semibold text-base">Download</span>
                </button>
              ) : (
                <Link
                  href="/login"
                  className="cursor-pointer flex items-center gap-3 px-8 py-3 bg-cyan-500/10 hover:bg-cyan-500/30 border border-cyan-500/30 hover:border-cyan-500/60 text-cyan-200 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95 group"
                >
                  <DownloadIcon
                    size={20}
                    className="group-hover:text-cyan-400 transition-colors"
                  />
                  <span className="font-semibold text-base">Download</span>
                </Link>
              )}
            </div>

            <p className="text-xs text-zinc-400 tracking-wide select-none">
              * É necessário fazer cadastro/login para efetuar o download.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
