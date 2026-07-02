import { useRef, useState } from "react";
import { ArrowLeftIcon, PlayIcon } from "@primer/octicons-react";
import useLanguage from "hooks/useLanguage";

function Loop({ src, className = "" }) {
  return (
    <div
      className={`relative shrink-0 rounded-xl overflow-hidden border border-white/10 bg-black/40 shadow-inner ${className}`}
    >
      <video
        src={src}
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover"
      />
      {/* Glass sheen — same gradient as .glass-card */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/10 to-transparent" />
    </div>
  );
}

/* Multi-format delivery — big 16:9 tiles first, then justified rows where
   each piece grows proportionally to its aspect ratio (equal heights,
   filling the full card width edge to edge) */
const BF_FILMS = ["/vivo/bf_16x9.webm", "/vivo/bf_16x9_qr.webm"];

const BF_BUMPERS = [
  "/vivo/bf_bumper_jbl.webm",
  "/vivo/bf_bumper_a52s.webm",
  "/vivo/bf_banner_art.webm",
];

const BF_TALL = [
  ["/vivo/bf_1x1_s20.webm", "aspect-square", "lg:grow-[1]"],
  ["/vivo/bf_1x1_a52s.webm", "aspect-square", "lg:grow-[1]"],
  ["/vivo/bf_9x16_s20.webm", "aspect-[9/16]", "lg:grow-[0.5625]"],
  ["/vivo/bf_9x16_a52s.webm", "aspect-[9/16]", "lg:grow-[0.5625]"],
  ["/vivo/bf_banner_400x1080.webm", "aspect-[400/1080]", "lg:grow-[0.37]"],
];

const NATAL_ROW = [
  ["/vivo/natal_16x9_samsung.webm", "aspect-video", "lg:grow-[1.778]"],
  ["/vivo/natal_16x9_moto.webm", "aspect-video", "lg:grow-[1.778]"],
  ["/vivo/natal_1x1_samsung.webm", "aspect-square", "lg:grow-[1]"],
  ["/vivo/natal_1x1_moto.webm", "aspect-square", "lg:grow-[1]"],
];

export default function CardVivo({ onBack }) {
  const { t } = useLanguage();
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const specs = [
    ["Ferramenta", "After Effects, Photoshop"],
    ["Plataforma", "vivo_platform"],
    ["Mercado", "Brasil"],
  ];

  return (
    <div className="w-full h-auto lg:h-full animate-[fadeIn_0.12s_ease-out]">
      <div className="glass-card rounded-[20px] p-6 shadow-2xl relative overflow-hidden flex flex-col h-auto lg:h-full transition-all duration-500 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent -z-10 pointer-events-none"></div>

        {/* Header — back + title + description beside it */}
        <div className="shrink-0 mb-4 flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 relative z-10">
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onBack}
              aria-label={t("Voltar")}
              className="cursor-pointer text-white/50 hover:text-white transition-colors flex items-center justify-center -ml-1 pr-1"
            >
              <ArrowLeftIcon size={18} />
            </button>
            <h2 className="sr-only">Vivo - Black Friday & {t("Natal")}</h2>
            <div className="relative h-10 lg:h-12 rounded-lg overflow-hidden border border-white/10 bg-black/40">
              <video
                src="/vivo/title.webm"
                autoPlay
                loop
                muted
                playsInline
                aria-hidden="true"
                className="h-full w-auto"
              />
            </div>
          </div>
          <p className="flex-1 min-w-0 text-white/70 leading-relaxed text-base sm:-mt-1">
            {t("vivo_desc")}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-3 relative z-10 flex flex-col gap-6">
          {/* ===== Black Friday ===== */}
          <section className="flex flex-col gap-3 lg:gap-4">
            <div className="text-xs font-bold tracking-widest uppercase text-white/40">
              Black Friday
            </div>

            {/* Main film + specs beside it */}
            <div className="shrink-0 flex flex-col lg:flex-row gap-4 lg:gap-6">
              {/* Main piece — click to play, with sound */}
              <div
                onClick={togglePlay}
                className="relative shrink-0 w-full lg:w-4/5 rounded-xl overflow-hidden border border-white/10 bg-black/40 shadow-inner aspect-video cursor-pointer group/video"
              >
                <video
                  ref={videoRef}
                  src="/vivo/bf_filme_10s.webm"
                  loop
                  playsInline
                  className="w-full h-full object-cover group-hover/video:scale-[1.01] transition-transform duration-500"
                />

                {/* Play overlay (CardReel pattern, compact) */}
                <div
                  className={`absolute inset-0 z-10 flex items-center justify-center bg-black/35 backdrop-blur-[1px] transition-all duration-300 ${
                    isPlaying ? "opacity-0 pointer-events-none" : "opacity-100"
                  }`}
                >
                  <div className="relative w-24 h-24 flex items-center justify-center group/btn hover:scale-110 active:scale-95 transition-all duration-500">
                    <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-md opacity-70 group-hover/btn:opacity-100 group-hover/btn:scale-110 transition-all duration-500 animate-[pulse_2s_infinite]"></div>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md border border-white/20 border-t-white/40 border-b-white/5 shadow-[inset_0_2px_6px_rgba(255,255,255,0.4),0_8px_32px_rgba(0,0,0,0.3),0_0_15px_rgba(6,182,212,0.25)] group-hover/btn:shadow-[inset_0_2px_8px_rgba(255,255,255,0.6),0_0_25px_rgba(6,182,212,0.5)] transition-all duration-500"></div>
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                      <PlayIcon
                        size={40}
                        className="text-cyan-200 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)] group-hover/btn:text-white transition-colors duration-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Specs — stacked beside the video */}
              <div className="flex-1 flex flex-col justify-start gap-3 lg:gap-4">
                {specs.map(([label, value]) => (
                  <div
                    key={label}
                    className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-center"
                  >
                    <div className="text-xs font-bold tracking-widest uppercase text-white/40">
                      {t(label)}
                    </div>
                    <div className="text-base text-white/80 mt-1">
                      {t(value)}
                    </div>
                  </div>
                ))}

                {/* Vertical piece filling the leftover space */}
                <div className="hidden lg:block flex-1 min-h-0">
                  <Loop
                    src="/vivo/bf_banner_768x1080.webm"
                    className="h-full"
                  />
                </div>
              </div>
            </div>

            {/* Films — big 16:9 tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
              {BF_FILMS.map((src) => (
                <Loop key={src} src={src} className="aspect-video" />
              ))}
            </div>

            {/* Bumpers & display art */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
              {BF_BUMPERS.map((src) => (
                <Loop key={src} src={src} className="aspect-video" />
              ))}
            </div>

            {/* Feed, stories & display — justified row, edge to edge */}
            <div className="flex flex-wrap gap-3 lg:gap-4">
              {BF_TALL.map(([src, ratio, grow]) => (
                <Loop
                  key={src}
                  src={src}
                  className={`h-40 ${ratio} lg:h-auto lg:basis-0 ${grow}`}
                />
              ))}
            </div>
          </section>

          {/* ===== Natal ===== */}
          <section className="flex flex-col gap-3 lg:gap-4">
            <div className="text-xs font-bold tracking-widest uppercase text-white/40">
              {t("Natal")}
            </div>

            <div className="flex flex-wrap gap-3 lg:gap-4">
              {NATAL_ROW.map(([src, ratio, grow]) => (
                <Loop
                  key={src}
                  src={src}
                  className={`h-40 ${ratio} lg:h-auto lg:basis-0 ${grow}`}
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
