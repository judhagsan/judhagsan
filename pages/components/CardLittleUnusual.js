import { ArrowLeftIcon } from "@primer/octicons-react";
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

export default function CardLittleUnusual({ onBack }) {
  const { t } = useLanguage();

  const specs = [
    ["Ferramenta", "Blender, Premiere, After Effects"],
    ["Plataforma", "Redes sociais"],
    ["Mercado", "Mundo todo"],
  ];

  return (
    <div className="w-full h-auto lg:h-full animate-[fadeIn_0.12s_ease-out]">
      <div className="glass-card rounded-[20px] p-4 lg:p-5 shadow-2xl relative overflow-hidden flex flex-col h-auto lg:h-full transition-all duration-500 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent -z-10 pointer-events-none"></div>

        {/* Header — back + animated logo + project info beside it */}
        <div className="shrink-0 mb-3 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 relative z-10">
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onBack}
              aria-label={t("Voltar")}
              className="cursor-pointer text-white/50 hover:text-white transition-colors flex items-center justify-center -ml-1 pr-1"
            >
              <ArrowLeftIcon size={18} />
            </button>
            <h2 className="sr-only">Little Unusual</h2>
            <div className="relative h-10 lg:h-12 rounded-lg overflow-hidden border border-white/10 bg-black/40">
              <video
                src="/little_unusual/little_unusual.webm"
                autoPlay
                loop
                muted
                playsInline
                aria-hidden="true"
                className="h-full w-auto"
              />
            </div>
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-1 text-base leading-relaxed">
            <p>
              <span className="text-xs font-bold tracking-widest uppercase text-white/40 mr-2">
                {t("Cliente")}
              </span>
              <span className="text-white/80">{t("lu_client")}</span>
            </p>
            <p>
              <span className="text-xs font-bold tracking-widest uppercase text-white/40 mr-2">
                {t("Minha função")}
              </span>
              <span className="text-white/80">{t("lu_role")}</span>
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-3 relative z-10 flex flex-col gap-5">
          {/* 3D explorations + specs beside them */}
          <div className="shrink-0 flex flex-col lg:flex-row gap-4 lg:gap-6">
            <div className="w-full lg:w-4/5 grid grid-cols-2 gap-4">
              <Loop
                src="/little_unusual/dimond_01.webm"
                className="aspect-square"
              />
              <Loop
                src="/little_unusual/dimond_02.webm"
                className="aspect-square"
              />
            </div>

            {/* Specs — stacked beside the media */}
            <div className="flex-1 flex flex-col justify-start gap-3 lg:gap-4">
              {specs.map(([label, value]) => (
                <div
                  key={label}
                  className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-center"
                >
                  <div className="text-xs font-bold tracking-widest uppercase text-white/40">
                    {t(label)}
                  </div>
                  <div className="text-sm text-white/80 mt-1">{t(value)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Key art */}
          <div className="relative shrink-0 w-full rounded-xl overflow-hidden border border-white/10 bg-black/40 shadow-inner">
            <img
              src="/little_unusual/dimond.jpg"
              alt="Little Unusual — key art"
              className="block w-full h-auto"
            />
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/10 to-transparent" />
          </div>
        </div>
      </div>
    </div>
  );
}
