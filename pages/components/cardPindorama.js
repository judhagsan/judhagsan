import { DownloadIcon, BookIcon } from "@primer/octicons-react";
export default function CardPindorama() {
  return (
    <div className="w-full h-full">
      <div className="glass-card rounded-[35px] p-6 shadow-2xl relative overflow-hidden flex flex-col h-full">
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
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Pindorama
          </h2>
        </div>

        {/* Content - Centered in remaining space */}
        <div className="flex-1 flex flex-col items-center justify-center text-center mt-6 mb-2">
          <p className="text-zinc-300 mb-10 max-w-2xl leading-relaxed text-lg font-medium">
            Desenvolvido de animador para animador. Combine a arte do
            frame-a-frame com a eficiência da animação 2D vetorial. Uma engine
            poderosa para mixed media, otimizada para entregar máxima
            performance respeitando o seu hardware.
          </p>

          <div className="flex gap-4">
            {/* Windows Download */}
            <button className="cursor-pointer flex items-center gap-3 px-8 py-3 bg-blue-500/10 hover:bg-blue-500/30 border border-blue-500/30 hover:border-blue-500/60 text-blue-200 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] active:scale-95 group">
              <DownloadIcon
                size={20}
                className="group-hover:text-blue-400 transition-colors"
              />
              <span className="font-semibold text-base">Windows</span>
            </button>

            {/* Linux Download */}
            <button className="cursor-pointer flex items-center gap-3 px-8 py-3 bg-yellow-500/10 hover:bg-yellow-500/30 border border-yellow-500/30 hover:border-yellow-500/60 text-yellow-200 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(234,179,8,0.3)] active:scale-95 group">
              <DownloadIcon
                size={20}
                className="group-hover:text-yellow-400 transition-colors"
              />
              <span className="font-semibold text-base">Linux</span>
            </button>

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
