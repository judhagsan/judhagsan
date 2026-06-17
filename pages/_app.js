import "../globals.css";
import Head from "next/head";
import { ActiveCardProvider } from "hooks/useActiveCard";
import { SidePanelProvider } from "hooks/useSidePanel";
import { LanguageProvider } from "hooks/useLanguage";

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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
