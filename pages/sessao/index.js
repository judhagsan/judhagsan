import Head from "next/head";
import { useEffect } from "react";
import { useRouter } from "next/router";
import CardYoutube from "../components/cardYoutube";
import CardUsuario from "../components/CardUsuario";
import CardDispositivos from "../components/CardDispositivos";
import CardApoiar from "../components/CardApoiar";
import CardSessao from "../components/CardSessao";
import CardPrivacidade from "../components/CardPrivacidade";
import CardContato from "../components/CardContato";
import CardAdminUsuarios from "../components/CardAdminUsuarios";
import CardAdminHardware from "../components/CardAdminHardware";
import MainFrame from "../components/MainFrame";
import useUser from "hooks/useUser";
import useSidePanel from "hooks/useSidePanel";
import useLanguage from "hooks/useLanguage";

export default function SessaoPage() {
  const router = useRouter();
  const { user, isLoading, isLoggedIn, isAdmin } = useUser();
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

      {/* Área de Conteúdo com Janelas Flutuantes */}
      <div className="relative z-10 w-full h-full flex flex-col p-2 lg:p-4 gap-6 overflow-y-auto lg:overflow-hidden font-mono">
        {/* Seção Central */}
        <div className="lg:flex-1 lg:min-h-0 lg:-mt-8 relative flex flex-col lg:block gap-4 lg:gap-0 overflow-visible shrink-0">
          {/* Coluna da esquerda: Usuário + Apoio (ou Pindorama compact para Admin) */}
          <div className="w-full lg:absolute lg:top-8 lg:left-0 lg:w-1/4 lg:max-h-[calc(100%-2rem)] flex flex-col gap-4 lg:overflow-y-auto lg:pr-4">
            {isLoggedIn && <CardUsuario user={user} />}
            {isLoggedIn && isAdmin && <CardSessao compact />}
            {isLoggedIn && !isAdmin && <CardApoiar />}
          </div>

          {/* Coluna da direita: Dispositivos */}
          {isLoggedIn && (
            <div
              className={`w-full lg:absolute lg:top-8 lg:right-0 lg:w-1/4 lg:max-h-[calc(100%-2rem)] flex-col gap-4 lg:overflow-y-auto lg:pl-4 ${
                activePanel ? "hidden lg:flex" : "flex"
              }`}
            >
              <CardDispositivos />
            </div>
          )}

          {/* Área Central: Pindorama (usuário comum) ou Painel Admin (administrador) ou Painel Lateral */}
          <div className="w-full lg:h-full lg:min-h-0 flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-0 lg:overflow-y-auto lg:pt-8">
            {isLoggedIn && isAdmin && (
              <div
                className={`w-full lg:w-1/2 shrink-0 lg:self-start flex flex-col gap-4 ${
                  activePanel ? "lg:hidden" : ""
                }`}
              >
                <CardAdminUsuarios />
                <CardAdminHardware />
              </div>
            )}

            {isLoggedIn && !isAdmin && (
              <div
                className={`w-full lg:w-1/3 shrink-0 lg:my-auto ${
                  activePanel ? "lg:hidden" : ""
                }`}
              >
                <CardSessao />
              </div>
            )}

            {/* Painel lateral (Privacidade ou Contato) */}
            {activePanel && (
              <div
                className="fixed inset-0 z-[52] bg-black lg:hidden"
                onClick={closeSidePanel}
              />
            )}
            <div
              className={`
                  ${
                    activePanel
                      ? "fixed inset-2 top-14 z-[53] lg:relative lg:inset-auto lg:top-auto lg:z-auto lg:w-1/2 lg:opacity-100"
                      : "hidden lg:block lg:w-0 lg:opacity-0"
                  }
                  transition-all duration-300 ease-out overflow-hidden lg:h-[90%]
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

        {/* Seção inferior - YouTube */}
        {!isLoading && !isAdmin && (
          <div className="lg:mt-auto flex flex-col w-full shrink-0 gap-4">
            <CardYoutube />
          </div>
        )}
      </div>
    </MainFrame>
  );
}
