import Head from "next/head";
import { useRouter } from "next/router";
import CardYoutube from "../components/cardYoutube";
import CardLogin from "../components/CardLogin";
import CardPrivacidade from "../components/CardPrivacidade";
import CardContato from "../components/CardContato";
import MainFrame from "../components/MainFrame";
import useSidePanel from "hooks/useSidePanel";
import useLanguage from "hooks/useLanguage";

export default function LoginPage() {
  const router = useRouter();
  const { activePanel, close: closeSidePanel } = useSidePanel();
  const { t } = useLanguage();

  return (
    <MainFrame>
      <Head>
        <title>{t("Login")} · JUDHAGSAN</title>
        <link rel="icon" href="/favicon.png" />
      </Head>

      <div className="relative z-10 w-full h-full flex flex-col p-2 lg:p-4 gap-6 overflow-y-auto lg:overflow-hidden">
        <div className="lg:flex-1 flex flex-col lg:flex-row items-stretch justify-start min-h-0 gap-4 lg:gap-6 shrink-0">
          <div
            className={`w-full lg:w-1/3 lg:h-auto lg:self-center shrink-0 lg:relative lg:z-10 lg:transition-transform lg:duration-[300ms] lg:ease-out ${
              activePanel ? "lg:translate-x-0" : "lg:translate-x-full"
            }`}
          >
            <div className="animate-[fadeIn_0.12s_ease-out]">
              <CardLogin
                onCadastroClick={() => router.push("/cadastro")}
                onBack={() => router.push("/")}
              />
            </div>
          </div>

          {activePanel && (
            <div
              className="fixed inset-0 z-[52] bg-black lg:hidden"
              onClick={closeSidePanel}
            />
          )}
          <div
            key={activePanel}
            className={`
              ${
                activePanel
                  ? "fixed inset-2 top-14 z-[53] lg:relative lg:inset-auto lg:top-auto lg:z-0 lg:flex-1 lg:h-full lg:w-auto lg:shrink-0 lg:opacity-100 card-enter lg:animate-[panelIn_0.3s_ease-out]"
                  : "hidden"
              }
              transition-all duration-300 ease-out lg:transition-none overflow-hidden
            `}
          >
            {activePanel === "privacy" && (
              <CardPrivacidade onClose={closeSidePanel} />
            )}
            {activePanel === "contact" && (
              <CardContato onClose={closeSidePanel} />
            )}
          </div>
        </div>

        <div className="lg:mt-auto flex items-end w-full shrink-0">
          <CardYoutube />
        </div>
      </div>
    </MainFrame>
  );
}
