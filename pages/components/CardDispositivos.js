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
    <div className="w-full">
      <div className="glass-card rounded-[20px] p-6 shadow-2xl relative overflow-hidden flex flex-col group transition-all duration-500 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent -z-10 pointer-events-none"></div>

        {/* Header */}
        <div className="shrink-0 mb-4 flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-full bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-500/15 shrink-0">
            <DevicesIcon size={20} />
          </div>
          <h2 className="text-lg lg:text-xl font-bold tracking-tight text-white/90">
            {t("Dispositivos")}
          </h2>
        </div>

        <div className="relative z-10 flex flex-col gap-3 text-white/70 font-mono text-sm">
          {isLoading && (
            <p className="text-white/40 text-center py-2">
              {t("Carregando...")}
            </p>
          )}

          {error && (
            <p className="text-red-300 text-center py-2">
              {t("Erro ao carregar dispositivos")}
            </p>
          )}

          {!isLoading && !error && data?.length === 0 && (
            <p className="text-white/40 text-center py-4 leading-relaxed">
              {t("Nenhum dispositivo registrado")}
            </p>
          )}

          {data?.map((device) => (
            <div
              key={device.id}
              className={`rounded-xl bg-white/5 border border-white/10 p-2 flex flex-col gap-3 transition-opacity ${
                device.upload_paused ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <DeviceDesktopIcon
                  size={18}
                  className="text-cyan-300 mt-0.5 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  {/* Specs: uma linha por campo, todas com mesma cor, peso
                      e tamanho — inclui o SO como mais um item da lista.
                      A versão do Pindorama + relative time fica numa fonte
                      mais discreta pra agir como rodapé. */}
                  <div className="flex flex-col gap-0.5 text-white text-sm leading-relaxed">
                    <p className="break-all">
                      {t("SO")}: {osLabel(device.os)}
                    </p>
                    {device.cpu && (
                      <p className="break-all">
                        {t("CPU")}: {device.cpu}
                      </p>
                    )}
                    {device.ram_bytes != null && (
                      <p>
                        {t("RAM")}: {formatRam(device.ram_bytes)}
                      </p>
                    )}
                    {device.gpu && (
                      <p className="break-all">
                        {t("GPU")}: {device.gpu}
                      </p>
                    )}
                    {device.monitor && (
                      <p className="break-all">
                        {t("Monitor")}: {device.monitor}
                      </p>
                    )}
                    {device.tablet && (
                      <p className="break-all">
                        {t("Mesa")}: {device.tablet}
                      </p>
                    )}
                  </div>
                  <p className="text-white/40 text-xs mt-2">
                    Pindorama v{device.pindorama_version || "?"} ·{" "}
                    {formatRelative(device.last_seen_at, language)}
                    {device.upload_paused && (
                      <span className="text-amber-300 ml-1">
                        ({t("pausado")})
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => togglePause(device)}
                  disabled={busyId === device.id}
                  className="cursor-pointer inline-flex items-center gap-2 text-xs uppercase tracking-widest text-white/40 hover:text-cyan-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {device.upload_paused ? (
                    <>
                      <PlayIcon size={12} />
                      {t("Retomar")}
                    </>
                  ) : (
                    <>
                      <PauseIcon size={12} />
                      {t("Pausar")}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => deleteDevice(device)}
                  disabled={busyId === device.id}
                  className="cursor-pointer inline-flex items-center gap-2 text-xs uppercase tracking-widest text-white/40 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <TrashIcon size={12} />
                  {t("Excluir")}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
