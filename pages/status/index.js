import useSWR from "swr";
import Head from "next/head";
import MainFrame from "../components/MainFrame";
import CardNormal from "../components/CardNormal";

async function fetchAPI(key) {
  const response = await fetch(key);
  const responseBody = await response.json();
  return responseBody;
}

export default function StatusPage() {
  return (
    <MainFrame>
      <Head>
        <title>Status do Sistema - JUDHAGSAN</title>
        <link rel="icon" href="/favicon.png" />
      </Head>

      {/* Main Container */}
      <div className="relative z-10 w-full h-full rounded-[35px] overflow-hidden border border-white/5 shadow-[inset_0px_0px_50px_rgba(0,0,0,0.9)] flex">
        <div className="relative z-10 flex-1 flex flex-col p-10 overflow-y-auto w-full items-center">
          <div className="w-full max-w-4xl flex flex-col items-center mt-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-medium text-emerald-400/90 tracking-wide uppercase">
                System Status
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <UpdatedAt />
              <DatabaseStatus />
            </div>
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

  let updatedAtText = "Carregando...";

  if (!isLoading && data) {
    updatedAtText = new Date(data.updated_at).toLocaleString("pt-BR");
  }

  return (
    <CardNormal title="Visão Geral">
      <div className="flex flex-col gap-1.5 bg-black/20 p-4 rounded-xl border border-white/5 h-full justify-center">
        <span className="text-white/40 uppercase text-[10px] font-sans tracking-wider">
          Última Atualização
        </span>
        <span className="text-lg text-cyan-400 font-medium">
          {updatedAtText}
        </span>

        <div className="h-[1px] w-full bg-white/5 my-2"></div>

        <span className="text-white/40 uppercase text-[10px] font-sans tracking-wider mt-1">
          Status Report
        </span>
        <div className="flex items-center gap-2 mt-1">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={
                isLoading
                  ? "animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"
                  : "animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
              }
            ></span>
            <span
              className={
                isLoading
                  ? "relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-500"
                  : "relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"
              }
            ></span>
          </span>
          <span
            className={
              isLoading
                ? "text-yellow-400 font-sans text-sm"
                : "text-emerald-400 font-sans text-sm"
            }
          >
            {isLoading ? "Buscando telemetria..." : "Sistemas Operacionais"}
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

  return (
    <CardNormal title="Banco de Dados">
      {isLoading || !data ? (
        <div className="flex items-center justify-center h-full min-h-[140px] text-white/30 bg-black/20 rounded-xl border border-white/5">
          <span className="animate-pulse font-sans text-sm">
            Carregando métricas...
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 h-full">
          <div className="flex flex-col gap-1 bg-black/20 p-3 rounded-xl border border-white/5 justify-center">
            <span className="text-white/40 uppercase text-[10px] font-sans tracking-wider">
              Versão (PostgreSQL)
            </span>
            <span
              className="text-base text-white/90 truncate"
              title={data?.dependencies?.database?.version || "N/A"}
            >
              {data?.dependencies?.database?.version?.split(" ")[0] || "N/A"}
            </span>
          </div>

          <div className="flex flex-col gap-1 bg-black/20 p-3 rounded-xl border border-white/5 justify-center">
            <span className="text-white/40 uppercase text-[10px] font-sans tracking-wider">
              Max Conexões
            </span>
            <span className="text-base text-white/90">
              {data?.dependencies?.database?.max_connections ?? "N/A"}
            </span>
          </div>

          <div className="flex flex-col gap-1 bg-black/20 p-4 rounded-xl border border-white/5 col-span-2">
            <div className="flex justify-between items-end mb-1">
              <span className="text-white/40 uppercase text-[10px] font-sans tracking-wider">
                Conexões Ativas
              </span>
              <span className="text-cyan-400 font-bold text-xl leading-none">
                {data?.dependencies?.database?.opened_connections ?? "N/A"}
              </span>
            </div>

            <div className="w-full h-1.5 bg-black/40 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full relative"
                style={{
                  width: `${Math.min(((data?.dependencies?.database?.opened_connections || 0) / (data?.dependencies?.database?.max_connections || 1)) * 100, 100)}%`,
                }}
              >
                <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[9px] text-white/30">0%</span>
              <span className="text-[9px] text-white/30">
                Uso:{" "}
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
