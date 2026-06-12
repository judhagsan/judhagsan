import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import PerspectiveGrid from "./PerspectiveGrid";
import useUser from "hooks/useUser";
import useSidePanel from "hooks/useSidePanel";
import useActiveCard from "hooks/useActiveCard";
import { ThreeBarsIcon, XIcon } from "@primer/octicons-react";

const PAGES_WITH_SIDE_PANEL = ["/", "/cadastro", "/sessao"];

export default function MainFrame({ children }) {
  const router = useRouter();
  const { isLoading, isLoggedIn, logout } = useUser();
  const { setActivePanel } = useSidePanel();
  const { setActiveCard, reset: resetActiveCard } = useActiveCard();
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
    <div className="h-[100dvh] lg:h-screen bg-[#050505] pt-11 lg:pt-10 px-1 lg:px-2 pb-1 lg:pb-2 flex items-stretch lg:items-center justify-center font-outfit text-white selection:bg-cyan-500/30 overflow-x-hidden relative">
      <PerspectiveGrid />

      {/* Glass Frame Overlay — hidden on mobile/tablet for performance */}
      <div className="absolute inset-0 z-0 pointer-events-none hidden lg:block">
        <div
          className="absolute inset-0 bg-white/5 backdrop-blur-sm 
    [mask-image:linear-gradient(to_bottom,black_4%,transparent_4.8%,transparent_80%,black_100%),linear-gradient(to_right,black_0%,transparent_0.8%,transparent_80%,black_100%)]
    [mask-composite:add]"
        ></div>

        {/* Borda decorativa opcional (mantive para dar o acabamento) */}
        <div className="absolute inset-0 border-[1px] border-white/10 pointer-events-none"></div>
      </div>

      {/* ======= DESKTOP NAVBAR ======= */}

      {/* Top-left Links - Privacidade + Contato (desktop only) */}
      <div className="absolute top-2 left-[3%] z-50 hidden lg:flex items-center gap-6 h-6 leading-none">
        {hasSidePanel ? (
          <button
            type="button"
            onClick={() => setActivePanel("privacy")}
            className="cursor-pointer inline-flex items-center text-sm font-bold tracking-widest uppercase text-white/70 hover:text-white transition-colors leading-none"
          >
            Termos de Uso
          </button>
        ) : (
          <Link
            href="/privacidade"
            className="inline-flex items-center text-sm font-bold tracking-widest uppercase text-white/70 hover:text-white transition-colors leading-none"
          >
            Termos de Uso
          </Link>
        )}
        {hasSidePanel ? (
          <button
            type="button"
            onClick={() => setActivePanel("contact")}
            className="cursor-pointer inline-flex items-center text-sm font-bold tracking-widest uppercase text-white/70 hover:text-white transition-colors leading-none"
          >
            Contato
          </button>
        ) : (
          <Link
            href="/contato"
            className="inline-flex items-center text-sm font-bold tracking-widest uppercase text-white/70 hover:text-white transition-colors leading-none"
          >
            Contato
          </Link>
        )}
      </div>

      {/* External Logo (always visible) */}
      <Link
        href={isLoggedIn ? "/sessao" : "/"}
        onClick={resetActiveCard}
        className="absolute top-2 left-1/2 -translate-x-1/2 z-50 cursor-pointer"
      >
        <img
          src="/Logo.png"
          alt="Pindorama"
          className="h-5 lg:h-6 w-auto opacity-90 hover:opacity-100 transition-opacity"
        />
      </Link>

      {/* Auth Actions (desktop only) */}
      <div className="absolute top-2 right-[3%] z-50 hidden lg:flex items-center gap-6 h-6 leading-none">
        {!isLoading &&
          (isLoggedIn ? (
            <button
              type="button"
              onClick={handleLogout}
              className="cursor-pointer inline-flex items-center text-sm font-bold tracking-widest uppercase text-white/70 hover:text-white transition-colors leading-none"
            >
              Sair
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleAuthCardClick("login")}
                className="cursor-pointer inline-flex items-center text-sm font-bold tracking-widest uppercase text-white/70 hover:text-white transition-colors leading-none"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => handleAuthCardClick("cadastro")}
                className="cursor-pointer inline-flex items-center text-sm font-bold tracking-widest uppercase text-white/70 hover:text-white transition-colors leading-none"
              >
                Cadastrar
              </button>
            </>
          ))}
      </div>

      {/* ======= MOBILE/TABLET HAMBURGER ======= */}

      {/* Hamburger button (mobile/tablet only) */}
      <button
        type="button"
        onClick={() => setMenuOpen(!menuOpen)}
        className="absolute top-2.5 right-3 z-[60] lg:hidden cursor-pointer text-white/70 hover:text-white transition-colors p-1"
        aria-label="Menu"
      >
        {menuOpen ? <XIcon size={22} /> : <ThreeBarsIcon size={22} />}
      </button>

      {/* Mobile/tablet menu overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[55] lg:hidden"
          onClick={() => setMenuOpen(false)}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          <nav
            className="absolute top-12 right-2 left-2 bg-[#111]/95 border border-white/10 rounded-2xl p-6 flex flex-col gap-1 animate-[fadeIn_0.15s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Navigation Links */}
            {hasSidePanel ? (
              <button
                type="button"
                onClick={() => handleSidePanelClick("privacy")}
                className="cursor-pointer text-left py-3 text-base font-bold tracking-widest uppercase text-white/70 hover:text-white transition-colors border-b border-white/5"
              >
                Termos de Uso
              </button>
            ) : (
              <Link
                href="/privacidade"
                onClick={() => setMenuOpen(false)}
                className="py-3 text-base font-bold tracking-widest uppercase text-white/70 hover:text-white transition-colors border-b border-white/5"
              >
                Termos de Uso
              </Link>
            )}

            {hasSidePanel ? (
              <button
                type="button"
                onClick={() => handleSidePanelClick("contact")}
                className="cursor-pointer text-left py-3 text-base font-bold tracking-widest uppercase text-white/70 hover:text-white transition-colors border-b border-white/5"
              >
                Contato
              </button>
            ) : (
              <Link
                href="/contato"
                onClick={() => setMenuOpen(false)}
                className="py-3 text-base font-bold tracking-widest uppercase text-white/70 hover:text-white transition-colors border-b border-white/5"
              >
                Contato
              </Link>
            )}

            {/* Auth actions */}
            {!isLoading && (
              <div className="flex flex-col gap-1 mt-2">
                {isLoggedIn ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="cursor-pointer text-left py-3 text-base font-bold tracking-widest uppercase text-red-400/80 hover:text-red-300 transition-colors"
                  >
                    Sair
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleAuthCardClick("login")}
                      className="cursor-pointer text-left py-3 text-base font-bold tracking-widest uppercase text-cyan-400/80 hover:text-cyan-300 transition-colors border-b border-white/5"
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAuthCardClick("cadastro")}
                      className="cursor-pointer text-left py-3 text-base font-bold tracking-widest uppercase text-cyan-400/80 hover:text-cyan-300 transition-colors"
                    >
                      Cadastrar
                    </button>
                  </>
                )}
              </div>
            )}
          </nav>
        </div>
      )}

      {/* Render the inner content (Main Container) here */}
      {children}

      {/* Decorative Floating Elements — smaller on mobile/tablet */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-50">
        <div className="absolute top-[10%] right-[5%] w-[200px] h-[200px] lg:w-[500px] lg:h-[500px] bg-cyan-500/10 rounded-full blur-[80px] lg:blur-[120px]"></div>
        <div className="absolute bottom-[0%] left-[0%] w-[150px] h-[150px] lg:w-[400px] lg:h-[400px] bg-purple-500/10 rounded-full blur-[60px] lg:blur-[100px]"></div>
      </div>
    </div>
  );
}
