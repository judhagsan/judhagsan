import { useEffect, useState } from "react";
import useSWR from "swr";
import { DownloadIcon, InfoIcon } from "@primer/octicons-react";
import useLanguage from "hooks/useLanguage";

const versionFetcher = (url) =>
  fetch(url).then((r) => (r.ok ? r.json() : null));

function getStageLabel(version) {
  if (!version) return null;
  const parts = version.split(".").map(Number);
  if (parts.length < 3 || parts.some((p) => Number.isNaN(p))) return null;
  const [major, minor] = parts;

  if (major === 0) {
    if (minor === 0) return "Pre-Alpha";
    if (minor === 9) return "Beta";
    return "Alpha";
  }
  return "Stable";
}

const PLATFORMS = {
  windows: {
    label: "Windows",
    available: true,
  },
  macos: {
    label: "Mac ARM",
    available: false,
  },
  linux: {
    label: "Linux",
    available: true,
  },
};

function detectPlatform() {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;
  if (/Windows/i.test(ua)) return "windows";
  if (/Mac|iPhone|iPad/i.test(ua)) return "macos";
  if (/Linux|X11/i.test(ua)) return "linux";
  return null;
}

function PlatformButton({ platformKey, primary, compact }) {
  const info = PLATFORMS[platformKey];
  const available = info.available;
  const href = available ? `/api/v1/download/${platformKey}` : "#";

  const sizeClasses = compact
    ? `flex-1 min-w-0 justify-center px-3 py-1.5 rounded-full text-[11px] gap-1.5 font-mono ${
        primary ? "bg-white text-black font-bold" : "bg-black text-white"
      }`
    : primary
      ? "px-8 py-3 text-sm gap-3 font-bold win-btn-primary"
      : "px-5 py-2 text-xs gap-2 font-mono win-btn";

  const availabilityClasses = available
    ? "cursor-pointer active:scale-95"
    : "cursor-not-allowed pointer-events-none border-zinc-800 text-zinc-600 bg-zinc-950";

  return (
    <a
      href={href}
      aria-disabled={!available}
      title={compact ? info.label : undefined}
      onClick={(e) => {
        if (!available) e.preventDefault();
      }}
      className={`inline-flex items-center rounded-full border border-white uppercase tracking-wider transition-colors ${sizeClasses} ${availabilityClasses}`}
    >
      <DownloadIcon size={primary && !compact ? 16 : 14} className="shrink-0" />
      <span className={compact ? "truncate" : undefined}>{info.label}</span>
    </a>
  );
}

export default function CardSessao({ compact = false }) {
  const { t } = useLanguage();
  const [platform, setPlatform] = useState(null);
  const { data: versionData } = useSWR("/api/v1/version", versionFetcher, {
    revalidateOnFocus: false,
  });

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  const stage = getStageLabel(versionData?.version);
  const versionLabel =
    stage && versionData?.version ? `${stage} ${versionData.version}` : null;

  return (
    <div className="w-full h-auto">
      <div className="rounded-2xl overflow-hidden border-2 border-white bg-black bg-noise flex flex-col h-auto relative font-mono">
        {/* Barra de Título Branca com Texto Preto */}
        <div className="h-10 shrink-0 flex items-center justify-between px-3.5 border-b-2 border-black bg-white text-black select-none">
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="w-5 h-5 rounded-full border-2 border-black bg-white shrink-0" />
            <span className="w-5 h-5 rounded-full bg-black shrink-0" />
            <span className="w-5 h-5 rounded-full bg-black shrink-0" />
          </div>

          <div className="flex items-center gap-2 min-w-0 mx-2">
            <span className="text-sm lg:text-base font-mono font-bold tracking-wider uppercase text-black">
              PINDORAMA
            </span>
            {versionLabel && (
              <span className="text-[10px] uppercase tracking-wider rounded-full border border-black px-2 py-0.5 text-zinc-700 font-bold">
                {versionLabel}
              </span>
            )}
          </div>

          <div
            className="w-20 shrink-0 pointer-events-none"
            aria-hidden="true"
          />
        </div>

        {/* Conteúdo */}
        <div className="p-5 flex flex-col items-center justify-center text-center">
          {!compact && (
            <p className="text-white mb-6 max-w-xl leading-relaxed text-sm lg:text-base font-mono">
              {t("pindorama_desc")}
            </p>
          )}

          {platform && !PLATFORMS[platform].available && (
            <div className="mb-5 inline-flex items-center gap-2 px-3 py-2 border border-white bg-zinc-950 text-xs text-white animate-[fadeIn_0.2s_ease-out]">
              <InfoIcon size={14} className="shrink-0" />
              <span>
                {t("Versao para platform em breve", {
                  platform: PLATFORMS[platform].label,
                })}
              </span>
            </div>
          )}

          <div
            className={`flex items-center ${
              compact
                ? "w-full flex-nowrap gap-2"
                : "flex-wrap justify-center gap-3"
            }`}
          >
            {Object.keys(PLATFORMS).map((key) => (
              <PlatformButton
                key={key}
                platformKey={key}
                primary={key === platform}
                compact={compact}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
