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
    classes:
      "bg-blue-500/10 hover:bg-blue-500/30 border-blue-500/30 hover:border-blue-500/60 text-blue-200 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]",
    iconHover: "group-hover:text-blue-400",
  },
  macos: {
    label: "Mac ARM",
    available: false,
    classes:
      "bg-zinc-300/10 hover:bg-zinc-300/30 border-zinc-300/30 hover:border-zinc-300/60 text-zinc-200 hover:shadow-[0_0_20px_rgba(212,212,216,0.3)]",
    iconHover: "group-hover:text-zinc-100",
  },
  linux: {
    label: "Linux",
    available: true,
    classes:
      "bg-orange-500/10 hover:bg-orange-500/30 border-orange-500/30 hover:border-orange-500/60 text-orange-200 hover:shadow-[0_0_20px_rgba(249,115,22,0.3)]",
    iconHover: "group-hover:text-orange-400",
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

function PlatformButton({ platformKey, primary }) {
  const info = PLATFORMS[platformKey];
  const available = info.available;
  const href = available ? `/api/v1/download/${platformKey}` : "#";

  const sizeClasses = primary
    ? "px-8 py-3 text-base gap-3 font-semibold"
    : "px-4 py-2 text-xs gap-2 font-medium";

  const colorClasses = available
    ? `${info.classes} cursor-pointer hover:scale-105 active:scale-95`
    : `${info.classes} opacity-40 cursor-not-allowed pointer-events-none`;

  return (
    <a
      href={href}
      aria-disabled={!available}
      onClick={(e) => {
        if (!available) e.preventDefault();
      }}
      className={`inline-flex items-center border rounded-xl transition-all duration-300 group ${sizeClasses} ${colorClasses}`}
    >
      <DownloadIcon
        size={primary ? 20 : 14}
        className={
          available ? `${info.iconHover} transition-colors` : undefined
        }
      />
      <span>{info.label}</span>
    </a>
  );
}

export default function CardSessao() {
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
          <div className="flex items-baseline gap-3 min-w-0">
            <h2 className="text-lg lg:text-xl font-bold tracking-tight text-white/90">
              Pindorama
            </h2>
            {versionLabel && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-xs uppercase tracking-wider text-white/50 font-mono">
                {versionLabel}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center text-center mb-2">
          <p className="text-zinc-300 mb-6 max-w-2xl leading-relaxed text-base lg:text-lg font-medium">
            {t("pindorama_desc")}
          </p>

          {platform && !PLATFORMS[platform].available && (
            <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm animate-[fadeIn_0.3s_ease-out]">
              <InfoIcon size={14} />
              {t("Versao para platform em breve", {
                platform: PLATFORMS[platform].label,
              })}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3">
            {Object.keys(PLATFORMS).map((key) => (
              <PlatformButton
                key={key}
                platformKey={key}
                primary={key === platform}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
