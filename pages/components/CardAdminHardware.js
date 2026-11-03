import { useState } from "react";
import useSWR from "swr";
import { DeviceDesktopIcon } from "@primer/octicons-react";
import useLanguage from "hooks/useLanguage";
import CardNormal from "./CardNormal";

const fetcher = (url) =>
  fetch(url, { credentials: "include" }).then((r) =>
    r.ok ? r.json() : Promise.reject(r),
  );

const DIMENSIONS = [
  { key: "os", label: "SO" },
  { key: "cpu", label: "CPU" },
  { key: "gpu", label: "GPU" },
  { key: "ram", label: "RAM" },
  { key: "tablet", label: "Mesa" },
  { key: "monitor", label: "Monitor" },
];

function RankedBars({ rows, total }) {
  const top = rows[0]?.count || 1;

  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => (
        <li key={row.value} className="flex flex-col gap-1.5">
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="text-sm text-white truncate">{row.value}</span>
            <span className="ml-auto text-sm font-bold text-cyan-300 tabular-nums shrink-0">
              {row.count}
            </span>
          </div>

          <div
            className="h-2 w-full bg-black border border-zinc-800 overflow-hidden"
            role="img"
            aria-label={`${row.value}: ${row.count} de ${total}`}
          >
            <div
              className="h-full bg-cyan-400 transition-[width] duration-300"
              style={{ width: `${Math.max((row.count / top) * 100, 4)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function CardAdminHardware() {
  const { t } = useLanguage();
  const [dimension, setDimension] = useState("os");

  const { data, error, isLoading } = useSWR("/api/v1/devices/stats", fetcher, {
    revalidateOnFocus: false,
    onErrorRetry: (err, _key, _config, revalidate, { retryCount }) => {
      if (err?.status >= 400 && err?.status < 500) return;
      if (retryCount >= 3) return;
      setTimeout(() => revalidate({ retryCount }), 5000 * (retryCount + 1));
    },
  });

  const total = data?.total || 0;
  const rows = data?.dimensions?.[dimension] || [];

  const profile = ["os", "gpu", "ram"]
    .map((key) => data?.dimensions?.[key]?.[0]?.value)
    .filter(Boolean);

  return (
    <CardNormal
      title={t("Hardware dos usuarios")}
      icon={DeviceDesktopIcon}
      className="card-enter"
      bodyClassName="p-4 lg:p-5 flex flex-col gap-4 text-white"
    >
      {isLoading && (
        <p className="text-zinc-500 text-center py-4 text-sm">
          [{t("Carregando...")}]
        </p>
      )}

      {error && !isLoading && (
        <p className="text-white border border-white p-2.5 text-center text-sm">
          [!] {t("Erro ao carregar hardware")}
        </p>
      )}

      {!isLoading && !error && total === 0 && (
        <p className="text-zinc-500 text-center py-4 text-sm">
          {t("Nenhum dispositivo registrado ainda")}
        </p>
      )}

      {total > 0 && (
        <>
          {profile.length > 0 && (
            <div className="flex flex-col gap-1 border-b border-zinc-800 pb-3">
              <span className="text-xs uppercase tracking-wider text-zinc-500">
                {t("Perfil mais comum")}
              </span>
              <p className="text-base font-bold text-white leading-snug">
                {profile.join(" · ")}
              </p>
              <span className="text-xs text-zinc-400">
                {t("O mais frequente entre n dispositivos", { n: total })}
              </span>
            </div>
          )}

          {/* Filtros em botões estilo retro */}
          <div
            className="flex flex-wrap gap-1.5"
            role="tablist"
            aria-label={t("Hardware dos usuarios")}
          >
            {DIMENSIONS.map((each) => {
              const active = each.key === dimension;
              return (
                <button
                  key={each.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setDimension(each.key)}
                  className={`cursor-pointer rounded-full text-xs px-3.5 py-1 border transition-colors ${
                    active
                      ? "bg-cyan-400 border-cyan-400 text-black font-bold"
                      : "border-zinc-800 bg-black text-zinc-400 hover:text-cyan-400 hover:border-zinc-600"
                  }`}
                >
                  {t(each.label)}
                </button>
              );
            })}
          </div>

          {rows.length > 0 ? (
            <RankedBars rows={rows} total={total} />
          ) : (
            <p className="text-zinc-500 text-sm py-2">
              {t("Sem dados nesta categoria")}
            </p>
          )}
        </>
      )}
    </CardNormal>
  );
}
