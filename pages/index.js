import Head from "next/head";
import { useEffect } from "react";
import { useRouter } from "next/router";
import CardYoutube from "./components/cardYoutube";
import CardPindorama from "./components/cardPindorama";
import CardReel from "./components/CardReel";
import CardLogin from "./components/CardLogin";
import CardCadastro from "./components/CardCadastro";
import CardPrivacidade from "./components/CardPrivacidade";
import CardContato from "./components/CardContato";
import CardSobre from "./components/CardSobre";
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

      {/* Main Container (The "Clear" Window) */}
      <div className="relative z-10 w-full h-full rounded-[20px] overflow-hidden border border-white/5 shadow-[inset_0px_0px_50px_rgba(0,0,0,0.9)] flex flex-col">
        {/* Main Content Area */}
        <div className="relative z-10 flex-1 flex flex-col p-4 lg:p-6 gap-6 overflow-y-auto lg:overflow-hidden">
          {/* Center Section - Active card + Privacidade panel */}
          <div className="lg:flex-1 flex flex-col lg:flex-row items-stretch justify-start lg:justify-center min-h-0 gap-4 lg:gap-6 shrink-0">
            <div
              key={activeCard}
              className="w-full lg:w-1/3 lg:h-auto lg:self-center shrink-0 animate-[fadeIn_0.12s_ease-out]"
            >
              {centerCard}
            </div>

            {!activePanel && (
              <div className="w-full lg:flex-1 lg:h-full lg:w-auto shrink-0 animate-[fadeIn_0.12s_ease-out]">
                <CardReel />
              </div>
            )}

            {/* Side panel — full-screen overlay on mobile, inline on desktop */}
            {activePanel && (
              <div
                className="fixed inset-0 z-[52] bg-black/70 backdrop-blur-sm lg:hidden"
                onClick={closeSidePanel}
              />
            )}
            <div
              key={activePanel}
              className={`
                ${
                  activePanel
                    ? "fixed inset-2 top-14 z-[53] lg:relative lg:inset-auto lg:top-auto lg:z-auto lg:flex-1 lg:h-full lg:w-auto lg:shrink-0 lg:opacity-100 animate-[fadeIn_0.12s_ease-out]"
                    : "hidden"
                }
                transition-all duration-500 ease-out lg:transition-none overflow-hidden
              `}
            >
              {activePanel === "privacy" && (
                <CardPrivacidade onClose={closeSidePanel} />
              )}
              {activePanel === "contact" && (
                <CardContato onClose={closeSidePanel} />
              )}
              {activePanel === "about" && (
                <CardSobre onClose={closeSidePanel} />
              )}
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
