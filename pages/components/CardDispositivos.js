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
  return os.charAt(0).toUpperCase() + os.slice(1);
}

export default function CardDispositivos() {
  const { language, t } = useLanguage();
  const { data, error, isLoading, mutate } = useSWR(
    "/api/v1/devices",
    fetcher,
    {
      revalidateOnFocus: false,
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
    <div className="w-full font-mono">
      <div className="rounded-2xl overflow-hidden border-2 border-white bg-black bg-noise flex flex-col relative animate-[fadeIn_0.2s_ease-out]">
        {/* Barra de Título Branca com Texto Preto */}
        <div className="h-10 shrink-0 flex items-center justify-between px-3.5 border-b-2 border-black bg-white text-black select-none">
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="w-5 h-5 rounded-full border-2 border-black bg-white shrink-0" />
            <span className="w-5 h-5 rounded-full bg-black shrink-0" />
            <span className="w-5 h-5 rounded-full bg-black shrink-0" />
          </div>

          <div className="flex items-center gap-2 min-w-0 mx-2">
            <DevicesIcon size={17} className="shrink-0 text-black" />
            <h2 className="text-sm lg:text-base font-mono font-bold tracking-wider uppercase text-black truncate">
              {t("Dispositivos")}
            </h2>
          </div>

          <div
            className="w-20 shrink-0 pointer-events-none"
            aria-hidden="true"
          />
        </div>

        {/* Lista de Dispositivos */}
        <div className="p-4 flex flex-col gap-3 text-white text-sm">
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
              className={`border border-white p-3 flex flex-col gap-3 bg-black ${
                device.upload_paused ? "text-zinc-400 border-zinc-700" : ""
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

                  <div className="flex flex-col gap-0.5 text-sm text-white leading-relaxed font-mono">
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
                  className="win-btn text-sm flex-1 inline-flex items-center justify-center gap-1.5"
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
                  className="win-btn text-sm flex-1 inline-flex items-center justify-center gap-1.5 text-zinc-400 hover:text-white"
                >
                  <TrashIcon size={12} />
                  <span>{t("Excluir")}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
