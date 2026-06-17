import "../globals.css";
import Head from "next/head";
import { ActiveCardProvider } from "hooks/useActiveCard";
import { SidePanelProvider } from "hooks/useSidePanel";

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <ActiveCardProvider>
        <SidePanelProvider>
          <Component {...pageProps} />
        </SidePanelProvider>
      </ActiveCardProvider>
    </>
  );
}

export default MyApp;
