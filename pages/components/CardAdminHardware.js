import { useState } from "react";
import useSWR from "swr";
import { DeviceDesktopIcon } from "@primer/octicons-react";
import useLanguage from "hooks/useLanguage";
import CardNormal from "./CardNormal";

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
            <span className="text-sm text-white truncate">{row.value}</span>
            <span className="ml-auto text-sm font-bold text-cyan-300 tabular-nums shrink-0">
              {row.count}
            </span>
          </div>

          {/* A escala é relativa ao primeiro colocado, não ao total: com 5
              dispositivos e o líder em 3, escalar pelo total deixaria todas as
              barras curtas demais para comparar entre si. */}
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

  // O perfil junta o primeiro colocado de cada categoria. Pode descrever uma
  // máquina que ninguém tem — por isso a legenda diz "o mais frequente em cada
  // categoria" em vez de fingir que é um aparelho real.
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
          {/* O número que o card lidera. Não é gráfico: é uma resposta
              única, e uma barra só seria um gráfico de uma barra. */}
          {profile.length > 0 && (
            <div className="flex flex-col gap-1 border-b border-zinc-800 pb-3">
              <span className="text-xs uppercase tracking-wider text-zinc-500">
                {t("Perfil mais comum")}
              </span>
              <p className="text-base font-bold text-white leading-snug">
                {profile.join(" · ")}
              </p>
              {/* O total mora aqui, e não no cabeçalho: ao lado do título ele
                  disputava espaço com o título numa linha de 310px no celular,
                  e o título truncava. Aqui ele ainda diz de quantos aparelhos o
                  perfil foi tirado — que é a informação que faltava para o
                  número significar alguma coisa. */}
              <span className="text-xs text-zinc-400">
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
                  className={`cursor-pointer rounded-full text-xs px-3.5 py-1 border transition-colors ${
                    active
                      ? "bg-cyan-400 border-cyan-400 text-black font-bold"
                      : "border-zinc-800 bg-black text-zinc-400 hover:text-cyan-400 hover:border-zinc-600"
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
            <p className="text-zinc-500 text-sm py-2">
              {t("Sem dados nesta categoria")}
            </p>
          )}
        </>
      )}
    </CardNormal>
  );
}
