import Head from "next/head";
import { useState } from "react";
import { useRouter } from "next/router";
import {
  ArrowLeftIcon,
  BriefcaseIcon,
  VideoIcon,
} from "@primer/octicons-react";
import MainFrame from "../components/MainFrame";
import CardSos from "../components/CardSos";
import CardLittleUnusual from "../components/CardLittleUnusual";
import CardVivo from "../components/CardVivo";
import CardPoloVivo from "../components/CardPoloVivo";
import useLanguage from "hooks/useLanguage";

function MediaCard({ src, poster, label = "", onClick, zoom }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group/media block w-full cursor-pointer p-0 border-0 bg-transparent outline-none"
    >
      <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-black/40 shadow-inner transition-all duration-500 group-hover/media:border-white/25 group-hover/media:shadow-[0_0_30px_rgba(6,182,212,0.15)] group-focus-visible/media:border-white/40">
        {!loaded && !poster && (
          <div className="absolute inset-0 z-10 flex items-center justify-center text-white/25 animate-pulse pointer-events-none">
            <VideoIcon size={28} />
          </div>
        )}
        <video
          src={src}
          poster={poster}
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={() => setLoaded(true)}
          className={`w-full h-full object-cover transition duration-500 ${
            zoom
              ? "scale-[1.4] group-hover/media:scale-[1.44]"
              : "group-hover/media:scale-[1.02]"
          }`}
        />
        {/* Glass sheen — same gradient as .glass-card */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/10 to-transparent" />
      </div>
      <span className="block mt-2 text-center text-xs lg:text-sm font-bold tracking-widest uppercase text-white/50 transition-colors group-hover/media:text-white/90">
        {label}
      </span>
    </button>
  );
}

export default function PortfolioPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [project, setProject] = useState(null);

  return (
    <MainFrame>
      <Head>
        <title>{t("Portfolio")} · JUDHAGSAN</title>
        <link rel="icon" href="/favicon.png" />
      </Head>

      {/* Main Container (The "Clear" Window) */}
      <div className="relative z-10 w-full h-full rounded-[20px] overflow-hidden border border-white/5 shadow-[inset_0px_0px_50px_rgba(0,0,0,0.9)] flex flex-col">
        <div className="relative z-10 flex-1 min-h-0 flex flex-col p-3 lg:p-4 overflow-y-auto lg:overflow-hidden">
          {project === "sos" && (
            <div className="w-full lg:h-full lg:min-h-0">
              <CardSos onBack={() => setProject(null)} />
            </div>
          )}

          {project === "little_unusual" && (
            <div className="w-full lg:h-full lg:min-h-0">
              <CardLittleUnusual onBack={() => setProject(null)} />
            </div>
          )}

          {project === "vivo" && (
            <div className="w-full lg:h-full lg:min-h-0">
              <CardVivo onBack={() => setProject(null)} />
            </div>
          )}

          {project === "polo_vivo" && (
            <div className="w-full lg:h-full lg:min-h-0">
              <CardPoloVivo onBack={() => setProject(null)} />
            </div>
          )}

          {!project && (
            /* Portfolio card — abraça o conteúdo para deixar o fundo respirar */
            <div className="w-full lg:my-auto animate-[fadeIn_0.12s_ease-out]">
              <div className="glass-card rounded-[20px] p-4 lg:p-5 shadow-2xl relative overflow-hidden flex flex-col h-auto transition-all duration-500 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent -z-10 pointer-events-none"></div>

                {/* Header */}
                <div className="shrink-0 mb-3 flex items-center gap-3 relative z-10">
                  <button
                    type="button"
                    onClick={() => router.push("/")}
                    aria-label={t("Voltar")}
                    className="cursor-pointer text-white/50 hover:text-white transition-colors flex items-center justify-center -ml-1 pr-1"
                  >
                    <ArrowLeftIcon size={18} />
                  </button>
                  <div className="w-8 h-8 rounded-full bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-500/15 shrink-0">
                    <BriefcaseIcon size={16} />
                  </div>
                  <h2 className="text-base lg:text-lg font-bold tracking-tight text-white/90">
                    {t("Portfolio")}
                  </h2>
                </div>

                {/* Project grid */}
                <div className="relative z-10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                    <MediaCard
                      src="/sos/sos_seringa.webm"
                      poster="/sos/sos_seringa-poster.jpg"
                      label="State of Survival"
                      onClick={() => setProject("sos")}
                    />
                    <MediaCard
                      src="/vivo/bf_16x9_qr.webm"
                      poster="/vivo/bf_16x9_qr-poster.jpg"
                      label={`Vivo - Black Friday & ${t("Natal")}`}
                      onClick={() => setProject("vivo")}
                    />
                    <MediaCard
                      src="/little_unusual/little_unusual.webm"
                      poster="/little_unusual/dimond.jpg"
                      label="Little Unusual"
                      onClick={() => setProject("little_unusual")}
                    />
                    <MediaCard
                      src="/polo_vivo/polo_vivo.webm"
                      poster="/polo_vivo/polo_vivo-poster.jpg"
                      label="Polo Vivo"
                      zoom
                      onClick={() => setProject("polo_vivo")}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainFrame>
  );
}
