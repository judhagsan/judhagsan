import "../globals.css";
import { ActiveCardProvider } from "hooks/useActiveCard";
import { SidePanelProvider } from "hooks/useSidePanel";

function MyApp({ Component, pageProps }) {
  return (
    <ActiveCardProvider>
      <SidePanelProvider>
        <Component {...pageProps} />
      </SidePanelProvider>
    </ActiveCardProvider>
  );
}

export default MyApp;
