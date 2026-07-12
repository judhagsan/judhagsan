import Head from "next/head";
import useSWR from "swr";
import { HeartFillIcon } from "@primer/octicons-react";
import MainFrame from "../components/MainFrame";
import useLanguage from "hooks/useLanguage";

const fetcher = (url) =>
  fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(r)));

export default function ApoiadoresPage() {
  const { t } = useLanguage();
  const { data, error, isLoading } = useSWR("/api/v1/supporters", fetcher, {
    revalidateOnFocus: false,
  });

  const supporters = data?.supporters || [];

  return (
    <MainFrame>
      <Head>
        <title>{t("Apoiadores")} · JUDHAGSAN</title>
        <link rel="icon" href="/favicon.png" />
      </Head>

      <div className="relative z-10 w-full h-full rounded-[20px] overflow-hidden border border-white/5 shadow-[inset_0px_0px_50px_rgba(0,0,0,0.9)] flex">
        <div className="relative z-10 flex-1 flex flex-col items-center p-6 lg:p-10 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col items-center text-center gap-4 mt-8 lg:mt-16 mb-10">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-lg shadow-amber-400/20">
              <HeartFillIcon size={32} />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white/90">
              {t("Apoiadores")}
            </h1>
            <p className="text-zinc-300 max-w-xl leading-relaxed text-sm lg:text-base">
              {t("Texto agradecimento apoiadores")}
            </p>
          </div>

          {/* Lista */}
          {isLoading && (
            <p className="text-white/50 font-mono text-sm">
              {t("Carregando...")}
            </p>
          )}

          {error && (
            <p className="text-red-300 font-mono text-sm">
              {t("Erro ao carregar apoiadores")}
            </p>
          )}

          {!isLoading && !error && supporters.length === 0 && (
            <p className="text-white/50 font-mono text-sm">
              {t("Nenhum apoiador ainda")}
            </p>
          )}

          {supporters.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-3 max-w-3xl">
              {supporters.map((supporterItem) => (
                <span
                  key={supporterItem.username}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm font-mono transition-all duration-300 hover:bg-amber-500/20 hover:border-amber-500/50"
                >
                  <HeartFillIcon size={12} />
                  {supporterItem.username}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainFrame>
  );
}
