import "../globals.css";
import Head from "next/head";
import { Outfit } from "next/font/google";
import { ActiveCardProvider } from "hooks/useActiveCard";
import { SidePanelProvider } from "hooks/useSidePanel";
import { LanguageProvider } from "hooks/useLanguage";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "600", "800"],
  display: "swap",
});

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Expõe a família gerada por `next/font` em `:root` para cobrir
            `body` e portais montados direto em `document.body`. */}
        <style>{`:root { --font-outfit-next: ${outfit.style.fontFamily}; }`}</style>
      </Head>
      <LanguageProvider>
        <ActiveCardProvider>
          <SidePanelProvider>
            <Component {...pageProps} />
          </SidePanelProvider>
        </ActiveCardProvider>
      </LanguageProvider>
    </>
  );
}

export default MyApp;
