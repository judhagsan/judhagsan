import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/router";

const ActiveCardContext = createContext({
  activeCard: "default",
  setActiveCard: () => {},
  reset: () => {},
});

export function ActiveCardProvider({ children }) {
  const [activeCard, setActiveCard] = useState("default");
  const router = useRouter();

  useEffect(() => {
    function handleRouteChangeComplete(url) {
      const path = url.split("?")[0];
      if (path !== "/") {
        setActiveCard("default");
      }
    }
    router.events.on("routeChangeComplete", handleRouteChangeComplete);
    return () => {
      router.events.off("routeChangeComplete", handleRouteChangeComplete);
    };
  }, [router]);

  const reset = useCallback(() => setActiveCard("default"), []);

  return (
    <ActiveCardContext.Provider value={{ activeCard, setActiveCard, reset }}>
      {children}
    </ActiveCardContext.Provider>
  );
}

export default function useActiveCard() {
  return useContext(ActiveCardContext);
}
