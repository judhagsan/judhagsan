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
      <div className="relative z-10 w-full h-full rounded-[35px] overflow-hidden border border-white/5 shadow-[inset_0px_0px_50px_rgba(0,0,0,0.9)] flex">
        {/* Main Content Area */}
        <div className="relative z-10 flex-1 flex flex-col p-10">
          {/* Center Section - Cadastro + Privacidade panel */}
          <div className="flex-1 flex items-center justify-center min-h-0 gap-6 -mt-8">
            <div className="w-1/3 shrink-0">
              <CardCadastro onPrivacyClick={() => setActivePanel("privacy")} />
            </div>

            <div
              className={`transition-all duration-500 ease-out overflow-hidden h-[90%] ${
                activePanel ? "w-3/5 opacity-100" : "w-0 opacity-0"
              }`}
            >
              {activePanel === "privacy" && (
                <CardPrivacidade onClose={closeSidePanel} />
              )}
              {activePanel === "contact" && (
                <CardContato onClose={closeSidePanel} />
              )}
            </div>
          </div>

          <div className="mt-auto flex items-end w-full -mb-8">
            {/* Bottom Section - YouTube Card */}
            <CardYoutube />
          </div>
        </div>
      </div>
    </MainFrame>
  );
}
