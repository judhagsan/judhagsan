import "../globals.css";
import { ActiveCardProvider } from "hooks/useActiveCard";
import { PrivacyPanelProvider } from "hooks/usePrivacyPanel";

function MyApp({ Component, pageProps }) {
  return (
    <ActiveCardProvider>
      <PrivacyPanelProvider>
        <Component {...pageProps} />
      </PrivacyPanelProvider>
    </ActiveCardProvider>
  );
}

export default MyApp;
