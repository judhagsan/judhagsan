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
import useLanguage from "hooks/useLanguage";

export default function SessaoPage() {
  const router = useRouter();
  const { user, isLoading, isLoggedIn } = useUser();
  const { activePanel, close: closeSidePanel } = useSidePanel();
  const { t } = useLanguage();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace("/login");
    }
  }, [isLoading, isLoggedIn, router]);

  return (
    <MainFrame>
      <Head>
        <title>{t("Sessao")} · JUDHAGSAN</title>
        <link rel="icon" href="/favicon.png" />
      </Head>

      {/* Main Container (The "Clear" Window) */}
      <div className="relative z-10 w-full h-full rounded-[20px] overflow-hidden border border-white/5 shadow-[inset_0px_0px_50px_rgba(0,0,0,0.9)] flex">
        {/* Main Content Area */}
        <div className="relative z-10 flex-1 flex flex-col p-4 lg:p-6 gap-6 overflow-y-auto lg:overflow-hidden">
          {/* Center Section — stacked on mobile, complex layout on desktop */}
          <div className="lg:flex-1 lg:min-h-0 lg:-mt-8 relative flex flex-col lg:block gap-4 lg:gap-0 overflow-visible lg:overflow-visible shrink-0">
            {/* User + Dispositivos column — full-width on mobile, sidebar on desktop */}
            <div className="w-full lg:absolute lg:top-0 lg:left-0 lg:w-1/4 lg:max-h-full flex flex-col gap-4 lg:overflow-y-auto lg:pr-2">
              {isLoggedIn && <CardUsuario user={user} />}
              {isLoggedIn && <CardDispositivos />}
            </div>

            {/* Sessão + Side panel as centered flex group */}
            <div className="w-full lg:h-full flex flex-col lg:flex-row items-center justify-center gap-6">
              <div className="w-full lg:w-1/3 shrink-0">
                {isLoggedIn && <CardSessao />}
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
                      ? "fixed inset-2 top-14 z-[53] lg:relative lg:inset-auto lg:top-auto lg:z-auto lg:flex-1 lg:w-auto lg:opacity-100"
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
