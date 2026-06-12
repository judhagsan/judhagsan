import Head from "next/head";
import CardYoutube from "../components/cardYoutube";
import CardCadastro from "../components/CardCadastro";
import CardPrivacidade from "../components/CardPrivacidade";
import CardContato from "../components/CardContato";
import MainFrame from "../components/MainFrame";
import useSidePanel from "hooks/useSidePanel";

export default function CadastroPage() {
  const { activePanel, setActivePanel, close: closeSidePanel } = useSidePanel();

  return (
    <MainFrame>
      <Head>
        <title>Cadastro · JUDHAGSAN</title>
        <link rel="icon" href="/favicon.png" />
      </Head>

      {/* Main Container (The "Clear" Window) */}
      <div className="relative z-10 w-full h-full rounded-[20px] overflow-hidden border border-white/5 shadow-[inset_0px_0px_50px_rgba(0,0,0,0.9)] flex">
        {/* Main Content Area */}
        <div className="relative z-10 flex-1 flex flex-col p-4 lg:p-10 gap-6 lg:gap-0 overflow-y-auto lg:overflow-hidden">
          {/* Center Section - Cadastro + Privacidade panel */}
          <div className="lg:flex-1 flex flex-col lg:flex-row items-stretch lg:items-center justify-start lg:justify-center min-h-0 gap-4 lg:gap-6 lg:-mt-8">
            <div className="w-full max-w-md lg:w-1/3 shrink-0">
              <CardCadastro onPrivacyClick={() => setActivePanel("privacy")} />
            </div>

            {/* Side panel — full-screen overlay on mobile */}
            {activePanel && (
              <div
                className="fixed inset-0 z-[52] bg-black/70 backdrop-blur-sm lg:hidden"
                onClick={closeSidePanel}
              />
            )}
            <div
              className={`
                ${
                  activePanel
                    ? "fixed inset-2 top-14 z-[53] lg:relative lg:inset-auto lg:top-auto lg:z-auto lg:w-3/5 lg:opacity-100"
                    : "hidden lg:block lg:w-0 lg:opacity-0"
                }
                transition-all duration-500 ease-out overflow-hidden lg:h-[90%]
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

          <div className="mt-auto flex items-end w-full lg:-mb-8">
            {/* Bottom Section - YouTube Card */}
            <CardYoutube />
          </div>
        </div>
      </div>
    </MainFrame>
  );
}
