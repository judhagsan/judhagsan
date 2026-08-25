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

function PlatformButton({ platformKey, primary, compact }) {
  const info = PLATFORMS[platformKey];
  const available = info.available;
  const href = available ? `/api/v1/download/${platformKey}` : "#";

  /*
   * No modo compacto os três precisam caber em uma linha só dentro da coluna
   * de 1/4 de largura. `flex-1 min-w-0` divide o espaço em partes iguais e o
   * `truncate` do rótulo absorve o que faltar, então a linha nunca quebra —
   * em vez de encolher até estourar numa largura de tela específica.
   *
   * O destaque da plataforma detectada vira um anel em vez de tamanho maior:
   * aumentar um dos três é exatamente o que impedia a linha única.
   */
  const sizeClasses = compact
    ? `flex-1 min-w-0 justify-center px-2 py-2 text-[11px] gap-1.5 font-medium${
        primary ? " ring-1 ring-white/25" : ""
      }`
    : primary
      ? "px-8 py-3 text-base gap-3 font-semibold"
      : "px-4 py-2 text-xs gap-2 font-medium";

  const colorClasses = available
    ? `${info.classes} cursor-pointer hover:scale-105 active:scale-95`
    : `${info.classes} opacity-40 cursor-not-allowed pointer-events-none`;

  return (
    <a
      href={href}
      aria-disabled={!available}
      title={compact ? info.label : undefined}
      onClick={(e) => {
        if (!available) e.preventDefault();
      }}
      className={`inline-flex items-center border rounded-xl transition-all duration-300 group ${sizeClasses} ${colorClasses}`}
    >
      <DownloadIcon
        size={primary && !compact ? 20 : 14}
        className={`shrink-0 ${available ? `${info.iconHover} transition-colors` : ""}`}
      />
      <span className={compact ? "truncate" : undefined}>{info.label}</span>
    </a>
  );
}

/*
 * `compact` é o modo do painel administrativo: sem o parágrafo de descrição,
 * só título e botões. O card sai da área central larga e vai para a coluna
 * estreita da esquerda, onde o texto de divulgação não cabe nem faz sentido —
 * quem está no painel já conhece o produto.
 */
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
    <div className="w-full h-auto lg:h-auto">
      <div className="glass-card group rounded-[20px] p-4 lg:p-5 shadow-2xl relative overflow-hidden flex flex-col h-auto lg:h-auto">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent -z-10"></div>

        {/* Header */}
        <div className="shrink-0 mb-3 flex items-center gap-3 relative z-10">
          <div className="w-8 h-8 rounded-full bg-yellow-500/30 border border-yellow-400/40 flex items-center justify-center text-yellow-300 shadow-lg shadow-yellow-400/25 shrink-0">
            <img
              src="/PinLogo.svg"
              alt="PinLogo"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-base lg:text-lg font-bold tracking-tight text-white/90">
              Pindorama
            </h2>
            {versionLabel && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-xs uppercase tracking-wider text-white/50">
                {versionLabel}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center text-center mb-2">
          {!compact && (
            <p className="text-zinc-300 mb-6 max-w-2xl leading-relaxed text-base lg:text-lg font-medium">
              {t("pindorama_desc")}
            </p>
          )}

          {platform && !PLATFORMS[platform].available && (
            <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm animate-[fadeIn_0.3s_ease-out]">
              <InfoIcon size={14} />
              {t("Versao para platform em breve", {
                platform: PLATFORMS[platform].label,
              })}
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
