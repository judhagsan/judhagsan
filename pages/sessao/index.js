import Head from "next/head";
import { useEffect } from "react";
import { useRouter } from "next/router";
import CardYoutube from "../components/cardYoutube";
import CardUsuario from "../components/CardUsuario";
import CardDispositivos from "../components/CardDispositivos";
import CardSessao from "../components/CardSessao";
import CardPrivacidade from "../components/CardPrivacidade";
import CardContato from "../components/CardContato";
import MainFrame from "../components/MainFrame";
import useUser from "hooks/useUser";
import useSidePanel from "hooks/useSidePanel";

export default function SessaoPage() {
  const router = useRouter();
  const { user, isLoading, isLoggedIn } = useUser();
  const { activePanel, close: closeSidePanel } = useSidePanel();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace("/login");
    }
  }, [isLoading, isLoggedIn, router]);

  return (
    <MainFrame>
      <Head>
        <title>Sessão · JUDHAGSAN</title>
        <link rel="icon" href="/favicon.png" />
      </Head>

      {/* Main Container (The "Clear" Window) */}
      <div className="relative z-10 w-full h-full rounded-[35px] overflow-hidden border border-white/5 shadow-[inset_0px_0px_50px_rgba(0,0,0,0.9)] flex">
        {/* Main Content Area */}
        <div className="relative z-10 flex-1 flex flex-col p-10">
          {/* Center Section - Usuário (top-left) + Sessão (center) + Privacidade (right, pushes center) */}
          <div className="flex-1 min-h-0 -mt-8 relative">
            {/* Coluna esquerda: User card + Dispositivos card, empilhados.
                max-h-full + overflow-y-auto pra rolar caso a lista cresça. */}
            <div className="absolute top-0 left-0 w-1/4 max-h-full flex flex-col gap-4 overflow-y-auto pr-2">
              {isLoggedIn && <CardUsuario user={user} />}
              {isLoggedIn && <CardDispositivos />}
            </div>

            {/* Sessão + Privacidade as centered flex group (privacy pushes center left when open) */}
            <div className="h-full flex items-center justify-center gap-6">
              <div className="w-1/3 shrink-0">
                {isLoggedIn && <CardSessao />}
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
