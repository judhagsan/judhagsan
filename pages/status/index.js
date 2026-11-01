import useSWR from "swr";
import Head from "next/head";
import MainFrame from "../components/MainFrame";
import CardNormal from "../components/CardNormal";
import { PulseIcon, DatabaseIcon } from "@primer/octicons-react";
import useLanguage from "hooks/useLanguage";

async function fetchAPI(key) {
  const response = await fetch(key);
  const responseBody = await response.json();
  return responseBody;
}

export default function StatusPage() {
  const { t } = useLanguage();

  return (
    <MainFrame>
      <Head>
        <title>{t("Status do Sistema")} - JUDHAGSAN</title>
        <link rel="icon" href="/favicon.png" />
      </Head>

      <div className="relative z-10 w-full h-full flex flex-col p-4 lg:p-6 overflow-y-auto w-full items-center font-mono">
        <div className="w-full max-w-4xl flex flex-col items-center mt-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white bg-black text-white mb-8 text-xs font-mono uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span>{t("Status do Sistema")}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
            <UpdatedAt />
            <DatabaseStatus />
          </div>
        </div>
      </div>
    </MainFrame>
  );
}

function UpdatedAt() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });
  const { t, language } = useLanguage();

  let updatedAtText = t("Carregando...");

  if (!isLoading && data) {
    updatedAtText = new Date(data.updated_at).toLocaleString(
      language === "pt" ? "pt-BR" : "en-US",
    );
  }

  return (
    <CardNormal title={t("Visao Geral")} icon={PulseIcon}>
      <div className="flex flex-col gap-2 p-3 border border-zinc-800 bg-black h-full justify-center font-mono">
        <span className="text-zinc-400 uppercase text-xs tracking-wider">
          {t("Ultima Atualizacao")}
        </span>
        <span className="text-base text-white font-bold tabular-nums">
          {updatedAtText}
        </span>

        <div className="h-px w-full bg-zinc-800 my-1" />

        <span className="text-zinc-400 uppercase text-xs tracking-wider">
          {t("Status Report")}
        </span>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white shrink-0 animate-ping" />
          <span className="text-sm text-white">
            {isLoading
              ? t("Buscando telemetria...")
              : `[OK] ${t("Sistemas Operacionais")}`}
          </span>
        </div>
      </div>
    </CardNormal>
  );
}

function DatabaseStatus() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });
  const { t } = useLanguage();

  return (
    <CardNormal title={t("Banco de Dados")} icon={DatabaseIcon}>
      {isLoading || !data ? (
        <div className="flex items-center justify-center h-full min-h-[140px] text-zinc-500 border border-zinc-800 bg-black font-mono">
          <span className="text-sm">[{t("Carregando metricas...")}]</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 h-full font-mono">
          <div className="flex flex-col gap-1 p-3 border border-zinc-800 bg-black justify-center">
            <span className="text-zinc-400 uppercase text-xs tracking-wider">
              {t("Versao (PostgreSQL)")}
            </span>
            <span
              className="text-base font-bold text-white truncate"
              title={data?.dependencies?.database?.version || "—"}
            >
              {data?.dependencies?.database?.version?.split(" ")[0] || "—"}
            </span>
          </div>

          <div className="flex flex-col gap-1 p-3 border border-zinc-800 bg-black justify-center">
            <span className="text-zinc-400 uppercase text-xs tracking-wider">
              {t("Max Conexoes")}
            </span>
            <span className="text-base font-bold text-white">
              {data?.dependencies?.database?.max_connections ?? "—"}
            </span>
          </div>

          <div className="flex flex-col gap-1 p-3 border border-zinc-800 bg-black col-span-2">
            <div className="flex justify-between items-end mb-1">
              <span className="text-zinc-400 uppercase text-xs tracking-wider">
                {t("Conexoes Ativas")}
              </span>
              <span className="text-white font-bold text-lg leading-none tabular-nums">
                {data?.dependencies?.database?.opened_connections ?? "—"}
              </span>
            </div>

            <div className="w-full h-2 bg-black border border-white overflow-hidden mt-1">
              <div
                className="h-full bg-white transition-[width] duration-300"
                style={{
                  width: `${Math.min(((data?.dependencies?.database?.opened_connections || 0) / (data?.dependencies?.database?.max_connections || 1)) * 100, 100)}%`,
                  minWidth:
                    (data?.dependencies?.database?.opened_connections || 0) > 0
                      ? "4px"
                      : undefined,
                }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-zinc-400 font-mono">
              <span>0%</span>
              <span>
                {t("Uso")}:{" "}
                {data?.dependencies?.database?.opened_connections !== undefined
                  ? Math.round(
                      ((data?.dependencies?.database?.opened_connections || 0) /
                        (data?.dependencies?.database?.max_connections || 1)) *
                        100,
                    )
                  : 0}
                %
              </span>
            </div>
          </div>
        </div>
      )}
    </CardNormal>
  );
}
