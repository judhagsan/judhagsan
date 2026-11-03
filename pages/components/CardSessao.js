import { useEffect, useState } from "react";
import useSWR from "swr";
import { DownloadIcon, InfoIcon } from "@primer/octicons-react";
import useLanguage from "hooks/useLanguage";
import CardNormal from "./CardNormal";

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

  /*
   * No modo compacto os três precisam caber em uma linha só dentro da coluna
   * de 1/4 de largura. `flex-1 min-w-0` divide o espaço em partes iguais e o
   * `truncate` do rótulo absorve o que faltar, então a linha nunca quebra —
   * em vez de encolher até estourar numa largura de tela específica.
   *
   * O destaque da plataforma detectada vira o botão invertido
   * (`win-btn-primary`) em vez de tamanho maior: aumentar um dos três é
   * exatamente o que impedia a linha única. No compacto a borda é fina nos
   * três, para o primário não parecer de outra família.
   */
  const variantClass = primary ? "win-btn-primary" : "win-btn";
  const sizeClasses = compact
    ? "flex-1 min-w-0 px-3 py-1.5 gap-1.5 border"
    : primary
      ? "px-8 py-3 text-base gap-3"
      : "text-sm";

  const availabilityClasses = available
    ? ""
    : "cursor-not-allowed pointer-events-none border-zinc-800 text-zinc-600 bg-zinc-950";

  return (
    <a
      href={href}
      aria-disabled={!available}
      title={compact ? info.label : undefined}
      onClick={(e) => {
        if (!available) e.preventDefault();
      }}
      className={`${variantClass} ${sizeClasses} ${availabilityClasses}`}
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
    <CardNormal
      title="Pindorama"
      actions={
        versionLabel && (
          <span className="text-[10px] uppercase tracking-wider rounded-full border border-black px-2 py-0.5 text-zinc-700 font-bold whitespace-nowrap">
            {versionLabel}
          </span>
        )
      }
      bodyClassName="p-5 flex flex-col items-center justify-center text-center"
    >
      {!compact && (
        <p className="text-white mb-6 max-w-xl leading-relaxed text-base lg:text-lg">
          {t("pindorama_desc")}
        </p>
      )}

      {platform && !PLATFORMS[platform].available && (
        <div className="mb-5 inline-flex items-center gap-2 px-3 py-2 border border-white bg-zinc-950 text-sm text-white animate-[fadeIn_0.2s_ease-out]">
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
    </CardNormal>
  );
}
