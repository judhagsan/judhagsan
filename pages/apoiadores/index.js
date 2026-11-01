import Head from "next/head";
import Link from "next/link";
import useSWR from "swr";
import { HeartFillIcon } from "@primer/octicons-react";
import MainFrame from "../components/MainFrame";
import useLanguage from "hooks/useLanguage";
import useUser from "hooks/useUser";

const fetcher = (url) =>
  fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(r)));

export default function ApoiadoresPage() {
  const { t } = useLanguage();
  const { user } = useUser();
  const { data, error, isLoading } = useSWR("/api/v1/supporters", fetcher, {
    revalidateOnFocus: false,
  });

  const supporters = data?.supporters || [];
  const isSupporter = user?.features?.includes("apoiador");

  return (
    <MainFrame>
      <Head>
        <title>{t("Apoiadores")} · JUDHAGSAN</title>
        <link rel="icon" href="/favicon.png" />
      </Head>

      <div className="relative z-10 w-full h-full flex flex-col items-center p-4 lg:p-10 overflow-y-auto animate-[fadeIn_0.2s_ease-out] font-mono">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-3 mt-6 lg:mt-12 mb-8">
          <div className="w-14 h-14 border-2 border-white flex items-center justify-center text-white bg-black">
            <HeartFillIcon size={26} />
          </div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-widest uppercase text-white">
            {t("Apoiadores")}
          </h1>
          <p className="text-zinc-400 max-w-xl leading-relaxed text-xs lg:text-sm font-mono">
            {t("Texto agradecimento apoiadores")}
          </p>
        </div>

        {/* Lista */}
        {isLoading && (
          <p className="text-zinc-500 text-xs">[{t("Carregando...")}]</p>
        )}

        {error && (
          <p className="text-white border border-white p-2 text-xs">
            [!] {t("Erro ao carregar apoiadores")}
          </p>
        )}

        {!isLoading && !error && supporters.length === 0 && (
          <p className="text-zinc-500 text-xs">
            [{t("Nenhum apoiador ainda")}]
          </p>
        )}

        {supporters.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl">
            {supporters.map((supporterItem) => (
              <span
                key={supporterItem.username}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white bg-black text-white text-xs font-mono tracking-wider transition-colors hover:bg-white hover:text-black"
              >
                <HeartFillIcon size={10} />
                <span>{supporterItem.username}</span>
              </span>
            ))}
          </div>
        )}

        {/* CTA para quem ainda não apoia */}
        {!isSupporter && (
          <div className="mt-10 flex flex-col items-center gap-2 animate-[fadeIn_0.2s_ease-out]">
            <Link
              href="/apoiar"
              className="win-btn-primary px-6 py-2.5 text-xs inline-flex items-center gap-2"
            >
              <HeartFillIcon size={14} />
              <span>{t("Quero apoiar o Pindorama")}</span>
            </Link>
          </div>
        )}
      </div>
    </MainFrame>
  );
}
