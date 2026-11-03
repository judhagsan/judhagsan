import Head from "next/head";
import { useEffect } from "react";
import { useRouter } from "next/router";
import CardYoutube from "./components/cardYoutube";
import CardPindorama from "./components/cardPindorama";
import SupportersTicker from "./components/SupportersTicker";
import CardLogin from "./components/CardLogin";
import CardCadastro from "./components/CardCadastro";
import CardPrivacidade from "./components/CardPrivacidade";
import CardContato from "./components/CardContato";
import MainFrame from "./components/MainFrame";
import useUser from "hooks/useUser";
import useSidePanel from "hooks/useSidePanel";
import useActiveCard from "hooks/useActiveCard";
import useLanguage from "hooks/useLanguage";

export default function SamuraiDashboard() {
  const router = useRouter();
  const { isLoading, isLoggedIn } = useUser();
  const { activeCard, setActiveCard } = useActiveCard();
  const { activePanel, setActivePanel, close: closeSidePanel } = useSidePanel();
  const { t } = useLanguage();

  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      router.replace("/sessao");
    }
  }, [isLoading, isLoggedIn, router]);

  const showingPindorama = activeCard !== "login" && activeCard !== "cadastro";

  let centerCard;
  if (activeCard === "login") {
    centerCard = (
      <CardLogin
        onCadastroClick={() => setActiveCard("cadastro")}
        onBack={() => setActiveCard("pindorama")}
      />
    );
  } else if (activeCard === "cadastro") {
    centerCard = (
      <CardCadastro
        onPrivacyClick={() => setActivePanel("privacy")}
        onLoginClick={() => setActiveCard("login")}
        onBack={() => setActiveCard("login")}
      />
    );
  } else {
    centerCard = (
      <CardPindorama onDownloadClick={() => setActiveCard("login")} />
    );
  }

  return (
    <MainFrame>
      <Head>
        <title>{t("JUDHAGSAN")}</title>
        <link rel="icon" href="/favicon.png" />
      </Head>

      {/* Área Central com Janelas Flutuantes */}
      <div className="relative z-10 w-full h-full flex flex-col p-2 lg:p-4 gap-6 overflow-y-auto lg:overflow-hidden">
        {/* Seção Central - Card Ativo + Painel Lateral */}
        <div className="lg:flex-1 flex flex-col lg:flex-row items-stretch justify-start min-h-0 gap-4 lg:gap-6 shrink-0">
          <div
            className={`w-full lg:w-1/3 lg:self-center shrink-0 flex flex-col gap-4 lg:relative lg:z-10 lg:transition-transform lg:duration-[300ms] lg:ease-out ${
              activePanel ? "lg:translate-x-0" : "lg:translate-x-full"
            }`}
          >
            {showingPindorama && <SupportersTicker />}
            <div key={activeCard} className="animate-[fadeIn_0.12s_ease-out]">
              {centerCard}
            </div>
          </div>

          {/* Painel lateral para mobile e desktop */}
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
