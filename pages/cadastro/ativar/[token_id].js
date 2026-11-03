import Head from "next/head";
import { useRouter } from "next/router";
import CardYoutube from "../../components/cardYoutube";
import CardAtivacao from "../../components/CardAtivacao";
import MainFrame from "../../components/MainFrame";
import useLanguage from "hooks/useLanguage";

export default function AtivarPage() {
  const router = useRouter();
  const { token_id: tokenId } = router.query;
  const { t } = useLanguage();

  return (
    <MainFrame>
      <Head>
        <title>{t("Ativar_cadastro")} · JUDHAGSAN</title>
        <link rel="icon" href="/favicon.png" />
      </Head>

      <div className="relative z-10 w-full h-full flex flex-col p-2 lg:p-4 gap-6 overflow-y-auto lg:overflow-hidden">
        <div className="lg:flex-1 flex items-start lg:items-center justify-center pt-2 lg:pt-0 shrink-0">
          <div className="w-full max-w-md lg:w-1/3">
            <CardAtivacao tokenId={tokenId} />
          </div>
        </div>

        <div className="lg:mt-auto flex items-end w-full shrink-0">
          <CardYoutube />
        </div>
      </div>
    </MainFrame>
  );
}
