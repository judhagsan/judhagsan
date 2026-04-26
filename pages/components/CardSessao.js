import { useEffect, useState } from "react";
import { PersonFillIcon, DownloadIcon } from "@primer/octicons-react";

const PLATFORMS = {
  windows: { label: "Windows" },
  macos: { label: "macOS" },
  linux: { label: "Linux" },
};

function detectPlatform() {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;
  if (/Windows/i.test(ua)) return "windows";
  if (/Mac|iPhone|iPad/i.test(ua)) return "macos";
  if (/Linux|X11/i.test(ua)) return "linux";
  return null;
}

export default function CardSessao({ user }) {
  const [platform, setPlatform] = useState(null);

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  const detected = platform && PLATFORMS[platform];
  const downloadHref = detected ? `/api/v1/download/${platform}` : null;
  const downloadLabel = detected
    ? `Download Pindorama ${detected.label}`
    : "Download indisponível";

  return (
    <div className="w-full h-full">
      <div className="glass-card rounded-[35px] p-6 shadow-2xl relative overflow-hidden flex flex-col h-full group transition-all duration-500 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent -z-10 pointer-events-none"></div>

        <div className="flex flex-col items-center justify-center text-center gap-4 text-white/70 font-mono text-sm relative z-10 flex-1 h-full animate-[fadeIn_0.4s_ease-out]">
          <div className="w-14 h-14 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-200">
            <PersonFillIcon size={28} />
          </div>
          <p className="text-2xl text-white font-semibold">
            Bem vindo, <span className="text-cyan-300">{user?.username}</span>
          </p>

          <a
            href={downloadHref || "#"}
            aria-disabled={!downloadHref}
            onClick={(e) => {
              if (!downloadHref) e.preventDefault();
            }}
            className={`mt-4 inline-flex items-center gap-3 px-8 py-3 bg-cyan-500/10 border border-cyan-500/30 text-cyan-200 rounded-xl transition-all duration-300 group ${
              downloadHref
                ? "cursor-pointer hover:bg-cyan-500/30 hover:border-cyan-500/60 hover:scale-105 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95"
                : "opacity-50 cursor-not-allowed"
            }`}
          >
            <DownloadIcon
              size={20}
              className="group-hover:text-cyan-400 transition-colors"
            />
            <span className="font-semibold text-base">{downloadLabel}</span>
          </a>
        </div>
      </div>
    </div>
  );
}
