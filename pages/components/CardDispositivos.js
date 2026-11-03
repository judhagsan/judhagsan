import { useState } from "react";
import useSWR from "swr";
import {
  DevicesIcon,
  DeviceDesktopIcon,
  PauseIcon,
  PlayIcon,
  TrashIcon,
} from "@primer/octicons-react";
import useLanguage from "hooks/useLanguage";
import CardNormal from "./CardNormal";

const fetcher = (url) =>
  fetch(url, { credentials: "include" }).then((r) =>
    r.ok ? r.json() : Promise.reject(r),
  );

function formatRam(bytes) {
  if (typeof bytes !== "number" && typeof bytes !== "string") return "—";
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return "—";
  const gb = n / 1024 / 1024 / 1024;
  return `${gb.toFixed(1)} GB`;
}

function formatRelative(iso, language) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const diffMs = Date.now() - date.getTime();
  const seconds = Math.floor(diffMs / 1000);
  const isPt = language === "pt";
  if (seconds < 60) return isPt ? "agora" : "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return isPt ? `${minutes} min atrás` : `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return isPt ? `${hours}h atrás` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return isPt ? `${days}d atrás` : `${days}d ago`;
  return date.toLocaleDateString(isPt ? "pt-BR" : "en-US");
}

function osLabel(os) {
  if (!os) return "Dispositivo";
  // O `sw_vers` no macOS devolve "macOS 26.5" com inicial minúscula
  // (branding oficial da Apple). Capitalizamos pra deixar consistente com o
  // restante das linhas, que começam com a label do componente em maiúscula.
  return os.charAt(0).toUpperCase() + os.slice(1);
}

export default function CardDispositivos() {
  const { language, t } = useLanguage();
  const { data, error, isLoading, mutate } = useSWR(
    "/api/v1/devices",
    fetcher,
    {
      revalidateOnFocus: false,
      // 4xx é determinístico (sessão expirada ou conta sem a feature) —
      // re-tentar só martela o servidor e polui o console. Erros de rede
      // e 5xx mantêm retry com backoff, limitado a 3 tentativas.
      onErrorRetry: (err, _key, _config, revalidate, { retryCount }) => {
        if (err?.status >= 400 && err?.status < 500) return;
        if (retryCount >= 3) return;
        setTimeout(() => revalidate({ retryCount }), 5000 * (retryCount + 1));
      },
    },
  );
  const [busyId, setBusyId] = useState(null);

  async function togglePause(device) {
    if (busyId) return;
    setBusyId(device.id);
    try {
      const r = await fetch(`/api/v1/devices/${device.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ upload_paused: !device.upload_paused }),
      });
      if (r.ok) await mutate();
    } finally {
      setBusyId(null);
    }
  }

  async function deleteDevice(device) {
    if (busyId) return;
    setBusyId(device.id);
    try {
      const r = await fetch(`/api/v1/devices/${device.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (r.ok) await mutate();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <CardNormal
      title={t("Dispositivos")}
      icon={DevicesIcon}
      className="animate-[fadeIn_0.2s_ease-out]"
      bodyClassName="p-4 flex flex-col gap-3 text-white text-sm"
    >
      {isLoading && (
        <p className="text-zinc-500 text-center py-2 text-sm">
          [{t("Carregando...")}]
        </p>
      )}

      {error && (
        <p className="text-white border border-white p-2 text-center text-sm">
          [!] {t("Erro ao carregar dispositivos")}
        </p>
      )}

      {!isLoading && !error && data?.length === 0 && (
        <p className="text-zinc-500 text-center py-4 text-sm leading-relaxed">
          {t("Nenhum dispositivo registrado")}
        </p>
      )}

      {data?.map((device) => (
        <div
          key={device.id}
          className={`border p-3 flex flex-col gap-3 bg-black ${
            device.upload_paused
              ? "border-zinc-700 text-zinc-400"
              : "border-white"
          }`}
        >
          <div className="flex items-start gap-3">
            <DeviceDesktopIcon
              size={18}
              className="text-white mt-0.5 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-1.5 mb-2">
                <span className="font-bold text-sm uppercase tracking-wider text-white">
                  {osLabel(device.os)}
                </span>
                {device.upload_paused && (
                  <span className="border border-white px-1 text-xs text-zinc-400">
                    {t("pausado")}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-0.5 text-sm text-white leading-relaxed">
                {device.cpu && (
                  <p className="break-all">
                    <span className="text-zinc-500">{t("CPU")}:</span>{" "}
                    {device.cpu}
                  </p>
                )}
                {device.ram_bytes != null && (
                  <p>
                    <span className="text-zinc-500">{t("RAM")}:</span>{" "}
                    {formatRam(device.ram_bytes)}
                  </p>
                )}
                {device.gpu && (
                  <p className="break-all">
                    <span className="text-zinc-500">{t("GPU")}:</span>{" "}
                    {device.gpu}
                  </p>
                )}
                {device.monitor && (
                  <p className="break-all">
                    <span className="text-zinc-500">{t("Monitor")}:</span>{" "}
                    {device.monitor}
                  </p>
                )}
                {device.tablet && (
                  <p className="break-all">
                    <span className="text-zinc-500">{t("Mesa")}:</span>{" "}
                    {device.tablet}
                  </p>
                )}
              </div>

              <p className="text-zinc-500 text-xs mt-2 pt-1 border-t border-zinc-800">
                Pindorama v{device.pindorama_version || "?"} ·{" "}
                {formatRelative(device.last_seen_at, language)}
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => togglePause(device)}
              disabled={busyId === device.id}
              className="win-btn text-sm flex-1 gap-1.5"
            >
              {device.upload_paused ? (
                <>
                  <PlayIcon size={12} />
                  <span>{t("Retomar")}</span>
                </>
              ) : (
                <>
                  <PauseIcon size={12} />
                  <span>{t("Pausar")}</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => deleteDevice(device)}
              disabled={busyId === device.id}
              className="win-btn win-btn-muted text-sm flex-1 gap-1.5"
            >
              <TrashIcon size={12} />
              <span>{t("Excluir")}</span>
            </button>
          </div>
        </div>
      ))}
    </CardNormal>
  );
}
