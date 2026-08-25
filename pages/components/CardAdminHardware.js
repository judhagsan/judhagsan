import { useState } from "react";
import useSWR from "swr";
import { DeviceDesktopIcon } from "@primer/octicons-react";
import useLanguage from "hooks/useLanguage";

const fetcher = (url) =>
  fetch(url, { credentials: "include" }).then((r) =>
    r.ok ? r.json() : Promise.reject(r),
  );

// Ordem fixa, e o rótulo é o que a pessoa reconhece — não o nome da coluna.
const DIMENSIONS = [
  { key: "os", label: "SO" },
  { key: "cpu", label: "CPU" },
  { key: "gpu", label: "GPU" },
  { key: "ram", label: "RAM" },
  { key: "tablet", label: "Mesa" },
  { key: "monitor", label: "Monitor" },
];

/*
 * Uma barra por valor, todas do mesmo tom.
 *
 * Uma cor só porque a série é uma só: contagem de dispositivos. Sombrear por
 * posição no ranking seria pintar a ordenação, não o dado — a cor tem que
 * seguir a entidade, e aqui não há entidades diferentes para distinguir.
 *
 * O rótulo fica acima da barra, não numa coluna à esquerda: "NVIDIA GeForce
 * GTX 1660 Ti" tem 26 caracteres, e uma coluna de rótulo larga o bastante para
 * isso não deixaria barra nenhuma num card estreito.
 *
 * A contagem é rótulo direto, visível sempre, em vez de tooltip — tooltip não
 * existe em toque, e esconder o número atrás do mouse tornaria o card inútil
 * no celular.
 */
function RankedBars({ rows, total }) {
  const top = rows[0]?.count || 1;

  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => (
        <li key={row.value} className="flex flex-col gap-1.5">
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="text-sm text-white/80 truncate">{row.value}</span>
            <span className="ml-auto text-sm font-semibold text-white/90 tabular-nums shrink-0">
              {row.count}
            </span>
          </div>

          {/* Trilho recessivo, preenchimento fino, ponta do dado arredondada.
              A escala é relativa ao primeiro colocado, não ao total: com 5
              dispositivos e o líder em 3, escalar pelo total deixaria todas as
              barras curtas demais para comparar entre si. */}
          <div
            className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden"
            role="img"
            aria-label={`${row.value}: ${row.count} de ${total}`}
          >
            <div
              className="h-full rounded-r-[4px] bg-cyan-400 transition-[width] duration-500"
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

  // O perfil junta o primeiro colocado de cada categoria. Pode descrever uma
  // máquina que ninguém tem — por isso a legenda diz "o mais frequente em cada
  // categoria" em vez de fingir que é um aparelho real.
  const profile = ["os", "gpu", "ram"]
    .map((key) => data?.dimensions?.[key]?.[0]?.value)
    .filter(Boolean);

  return (
    <div className="w-full">
      <div className="glass-card card-enter rounded-[20px] p-5 lg:p-6 shadow-2xl relative overflow-hidden flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent -z-10 pointer-events-none"></div>

        {/* Cabeçalho */}
        <div className="shrink-0 flex items-center gap-3 relative z-10 min-w-0">
          <div className="w-8 h-8 rounded-full bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-500/15 shrink-0">
            <DeviceDesktopIcon size={16} />
          </div>
          <h2 className="text-lg font-bold tracking-tight text-white/90 truncate">
            {t("Hardware dos usuarios")}
          </h2>
        </div>

        <div className="relative z-10 mt-4 flex flex-col gap-4 text-white/70">
          {isLoading && (
            <p className="text-white/40 text-center py-4">
              {t("Carregando...")}
            </p>
          )}

          {error && !isLoading && (
            <p className="text-red-300 text-center py-4 text-sm">
              {t("Erro ao carregar hardware")}
            </p>
          )}

          {!isLoading && !error && total === 0 && (
            <p className="text-white/40 text-center py-4 text-sm">
              {t("Nenhum dispositivo registrado ainda")}
            </p>
          )}

          {total > 0 && (
            <>
              {/* O número que o card lidera. Não é gráfico: é uma resposta
                  única, e uma barra só seria um gráfico de uma barra. */}
              {profile.length > 0 && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] uppercase tracking-widest text-white/40">
                    {t("Perfil mais comum")}
                  </span>
                  <p className="text-base lg:text-lg font-semibold text-white/90 leading-snug">
                    {profile.join(" · ")}
                  </p>
                  {/* O total mora aqui, e não no cabeçalho: ao lado do
                      título ele disputava 106px com um título de 226px numa
                      linha de 310px no celular, e o título truncava. Aqui ele
                      ainda diz de quantos aparelhos o perfil foi tirado — que
                      é a informação que faltava para o número significar
                      alguma coisa. */}
                  <span className="text-xs text-white/30">
                    {t("O mais frequente entre n dispositivos", { n: total })}
                  </span>
                </div>
              )}

              {/* Filtros numa linha só, acima do gráfico. */}
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
                      className={`cursor-pointer px-2.5 py-1 rounded-lg border text-xs uppercase tracking-wider transition-all duration-200 ${
                        active
                          ? "bg-cyan-500/15 border-cyan-400/40 text-cyan-200"
                          : "bg-white/5 border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"
                      }`}
                    >
                      {/* `t()` devolve a própria chave quando não há
                          tradução, então SO/CPU/GPU/RAM passam direto e só
                          "Mesa" muda de idioma. */}
                      {t(each.label)}
                    </button>
                  );
                })}
              </div>

              {rows.length > 0 ? (
                <RankedBars rows={rows} total={total} />
              ) : (
                <p className="text-white/30 text-sm py-2">
                  {t("Sem dados nesta categoria")}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
