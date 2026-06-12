import Link from "next/link";
import { DownloadIcon, BookIcon } from "@primer/octicons-react";

export default function CardPindorama({ onDownloadClick }) {
  return (
    <div className="w-full h-full">
      <div className="glass-card rounded-[20px] p-6 shadow-2xl relative overflow-hidden flex flex-col h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent -z-10"></div>

        {/* Header - Aligned Top Left */}
        <div className="flex items-center gap-4 w-full">
          <div className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center shadow-lg shadow-yellow-500/30 border border-white/5 shrink-0">
            <img
              src="/PinLogo.svg"
              alt="PinLogo"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <h2 className="text-xl lg:text-2xl font-bold tracking-tight text-white">
            Pindorama
          </h2>
        </div>

        {/* Content - Centered in remaining space */}
        <div className="flex-1 flex flex-col items-center justify-center text-center mt-6 mb-2">
          <p className="text-zinc-300 mb-6 lg:mb-10 max-w-2xl leading-relaxed text-base lg:text-lg font-medium">
            Desenvolvido de animador para animador. Combine a arte do
            frame-a-frame com a eficiência da animação 2D vetorial. Uma engine
            poderosa para mixed media, otimizada para entregar máxima
            performance respeitando o seu hardware.
          </p>

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

            {/* Documentation Button */}
            <button className="cursor-pointer flex items-center gap-3 px-8 py-3 bg-purple-500/10 hover:bg-purple-500/30 border border-purple-500/30 hover:border-purple-500/60 text-purple-200 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] active:scale-95 group">
              <BookIcon
                size={20}
                className="group-hover:text-purple-400 transition-colors"
              />
              <span className="font-semibold text-base">Docs</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
