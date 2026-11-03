import Head from "next/head";
import CardYoutube from "../components/cardYoutube";
import CardPrivacidade from "../components/CardPrivacidade";
import MainFrame from "../components/MainFrame";
import useLanguage from "hooks/useLanguage";

export default function PrivacidadePage() {
  const { t } = useLanguage();

  return (
    <MainFrame>
      <Head>
        <title>{t("Termos de Uso")} · JUDHAGSAN</title>
        <link rel="icon" href="/favicon.png" />
      </Head>

      <div className="relative z-10 w-full h-full flex flex-col p-2 lg:p-4 gap-6 overflow-y-auto lg:overflow-hidden">
        <div className="lg:flex-1 flex items-start lg:items-center justify-center min-h-0 shrink-0">
          <div className="w-full h-full">
            <CardPrivacidade />
          </div>
        </div>

        <div className="lg:mt-auto flex items-end w-full shrink-0">
          <CardYoutube />
        </div>
      </div>
    </MainFrame>
  );
}
