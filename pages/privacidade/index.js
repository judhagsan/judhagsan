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

      {/* Main Container (The "Clear" Window) */}
      <div className="relative z-10 w-full h-full rounded-[20px] overflow-hidden border border-white/5 shadow-[inset_0px_0px_50px_rgba(0,0,0,0.9)] flex">
        {/* Main Content Area */}
        <div className="relative z-10 flex-1 flex flex-col p-4 lg:p-6 gap-6">
          {/* Center Section - Privacidade Card */}
          <div className="lg:flex-1 flex items-start lg:items-center justify-center min-h-0 shrink-0">
            <div className="w-full h-full lg:h-full">
              <CardPrivacidade />
            </div>
          </div>

          <div className="lg:mt-auto flex items-end w-full shrink-0">
            {/* Bottom Section - YouTube Card */}
            <CardYoutube />
          </div>
        </div>
      </div>
    </MainFrame>
  );
}
