import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import PerspectiveGrid from "./PerspectiveGrid";
import CardNormal from "./CardNormal";
import useUser from "hooks/useUser";
import useSidePanel from "hooks/useSidePanel";
import useActiveCard from "hooks/useActiveCard";
import { ThreeBarsIcon, XIcon } from "@primer/octicons-react";
import useLanguage from "hooks/useLanguage";

const PAGES_WITH_SIDE_PANEL = ["/", "/login", "/cadastro", "/sessao"];

export default function MainFrame({ children }) {
  const router = useRouter();
  const { isLoading, isLoggedIn, logout } = useUser();
  const { setActivePanel } = useSidePanel();
  const { setActiveCard, reset: resetActiveCard } = useActiveCard();
  const { language, setLanguage, t } = useLanguage();
  const hasSidePanel = PAGES_WITH_SIDE_PANEL.includes(router.pathname);
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    resetActiveCard();
    router.push("/");
    setMenuOpen(false);
  }

  async function handleAuthCardClick(card) {
    setActiveCard(card);
    if (router.pathname !== "/") {
      await router.push("/");
    }
    setMenuOpen(false);
  }

  function handleSidePanelClick(panel) {
    setActivePanel(panel);
    setMenuOpen(false);
  }

  return (
    <div className="h-[100dvh] lg:h-screen bg-black pt-12 lg:pt-12 px-2 lg:px-4 pb-2 lg:pb-3 flex items-stretch lg:items-center justify-center text-white overflow-x-hidden relative">
      <PerspectiveGrid />

      {/* ======= BARRA SUPERIOR DESKTOP ======= */}

      {/* Links do topo esquerdo - Termos de Uso + Contato */}
      <div className="absolute top-2 left-[3%] z-50 hidden lg:flex items-center gap-3 h-7">
        {hasSidePanel ? (
          <button
            type="button"
            onClick={() => setActivePanel("privacy")}
            className="win-btn px-3.5 py-1"
          >
            {t("Termos de Uso")}
          </button>
        ) : (
          <Link href="/privacidade" className="win-btn px-3.5 py-1">
            {t("Termos de Uso")}
          </Link>
        )}
        {hasSidePanel ? (
          <button
            type="button"
            onClick={() => setActivePanel("contact")}
            className="win-btn px-3.5 py-1"
          >
            {t("Contato")}
          </button>
        ) : (
          <Link href="/contato" className="win-btn px-3.5 py-1">
            {t("Contato")}
          </Link>
        )}
      </div>

      {/* Identidade Central - Logo */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center h-7">
        <Link
          href={isLoggedIn ? "/sessao" : "/"}
          onClick={resetActiveCard}
          className="cursor-pointer shrink-0 flex items-center justify-center contrast-125"
        >
          <img src="/Logo.png" alt="Pindorama" className="h-5 lg:h-6 w-auto" />
        </Link>
      </div>

      {/* Ações de Autenticação e Idioma no topo direito */}
      <div className="absolute top-2 right-[3%] z-50 hidden lg:flex items-center gap-3 h-7">
        {/* Seletor de Idioma em Pílula */}
        <div className="flex items-center gap-1.5 text-xs tracking-wider uppercase bg-black px-3 py-1 rounded-full border border-white select-none">
          <button
            type="button"
            onClick={() => setLanguage("pt")}
            className={`cursor-pointer transition-colors ${
              language === "pt"
                ? "text-white font-bold underline underline-offset-4"
                : "text-zinc-500 hover:text-white"
            }`}
          >
            PT-BR
          </button>
          <span className="text-zinc-600">|</span>
          <button
            type="button"
            onClick={() => setLanguage("en")}
            className={`cursor-pointer transition-colors ${
              language === "en"
                ? "text-white font-bold underline underline-offset-4"
                : "text-zinc-500 hover:text-white"
            }`}
          >
            ENG
          </button>
        </div>

        {/* Botões de Sessão / Conta em Pílula */}
        {!isLoading && (
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <button
                type="button"
                onClick={handleLogout}
                className="win-btn px-4 py-1"
              >
                {t("Sair")}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleAuthCardClick("login")}
                  className="win-btn px-4 py-1"
                >
                  {t("Login")}
                </button>
                <button
                  type="button"
                  onClick={() => handleAuthCardClick("cadastro")}
                  className="win-btn-primary px-4 py-1 border"
                >
                  {t("Cadastrar")}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* ======= BARRA SUPERIOR MOBILE ======= */}
      {/* Acima do fundo do menu (z-[55]) de propósito: aberto, o mesmo botão
          vira o X que fecha. */}
      <div className="absolute top-2 right-4 z-[60] flex lg:hidden items-center">
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? t("Fechar menu") : t("Abrir menu")}
          aria-expanded={menuOpen}
          className="cursor-pointer w-8 h-8 rounded-full flex items-center justify-center border border-white bg-black text-white hover:bg-white hover:text-black transition-colors"
        >
          {menuOpen ? <XIcon size={16} /> : <ThreeBarsIcon size={16} />}
        </button>
      </div>

      {/* Menu Mobile como Janela Flutuante */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[55] bg-black flex items-start justify-center pt-16 px-4 lg:hidden"
          onClick={() => setMenuOpen(false)}
        >
          <nav
            aria-label={t("Menu")}
            className="w-full max-w-sm animate-[fadeIn_0.15s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <CardNormal
              title={t("Menu")}
              onBack={() => setMenuOpen(false)}
              backLabel={t("Fechar menu")}
              className="shadow-2xl"
              bodyClassName="p-4 flex flex-col gap-3 text-sm"
            >
              {hasSidePanel ? (
                <button
                  type="button"
                  onClick={() => handleSidePanelClick("privacy")}
                  className="cursor-pointer text-left py-2 border-b border-zinc-800 uppercase tracking-wider text-white hover:bg-white hover:text-black transition-colors px-2"
                >
                  &gt; {t("Termos de Uso")}
                </button>
              ) : (
                <Link
                  href="/privacidade"
                  onClick={() => setMenuOpen(false)}
                  className="py-2 border-b border-zinc-800 uppercase tracking-wider text-white hover:bg-white hover:text-black transition-colors px-2"
                >
                  &gt; {t("Termos de Uso")}
                </Link>
              )}

              {hasSidePanel ? (
                <button
                  type="button"
                  onClick={() => handleSidePanelClick("contact")}
                  className="cursor-pointer text-left py-2 border-b border-zinc-800 uppercase tracking-wider text-white hover:bg-white hover:text-black transition-colors px-2"
                >
                  &gt; {t("Contato")}
                </button>
              ) : (
                <Link
                  href="/contato"
                  onClick={() => setMenuOpen(false)}
                  className="py-2 border-b border-zinc-800 uppercase tracking-wider text-white hover:bg-white hover:text-black transition-colors px-2"
                >
                  &gt; {t("Contato")}
                </Link>
              )}

              {!isLoading && (
                <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-zinc-700">
                  {isLoggedIn ? (
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="win-btn py-2.5"
                    >
                      {t("Sair")}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleAuthCardClick("login")}
                        className="win-btn py-2.5"
                      >
                        {t("Login")}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAuthCardClick("cadastro")}
                        className="win-btn-primary py-2.5 border"
                      >
                        {t("Cadastrar")}
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Seletor de Idioma Mobile */}
              <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-zinc-700 text-xs uppercase tracking-wider">
                <button
                  type="button"
                  onClick={() => {
                    setLanguage("pt");
                    setMenuOpen(false);
                  }}
                  className={`cursor-pointer transition-colors ${
                    language === "pt"
                      ? "text-white font-bold underline underline-offset-4"
                      : "text-zinc-500 hover:text-white"
                  }`}
                >
                  PT-BR
                </button>
                <span className="text-zinc-600">|</span>
                <button
                  type="button"
                  onClick={() => {
                    setLanguage("en");
                    setMenuOpen(false);
                  }}
                  className={`cursor-pointer transition-colors ${
                    language === "en"
                      ? "text-white font-bold underline underline-offset-4"
                      : "text-zinc-500 hover:text-white"
                  }`}
                >
                  ENG
                </button>
              </div>
            </CardNormal>
          </nav>
        </div>
      )}

      {/* Conteúdo Principal (Container de Janelas) */}
      {children}
    </div>
  );
}
