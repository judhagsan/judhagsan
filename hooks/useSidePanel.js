import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const SidePanelContext = createContext({
  activePanel: null,
  setActivePanel: () => {},
  close: () => {},
});

export function SidePanelProvider({ children }) {
  const [activePanel, setActivePanelState] = useState(null);
  const setActivePanel = useCallback((panel) => setActivePanelState(panel), []);
  const close = useCallback(() => setActivePanelState(null), []);

  const value = useMemo(
    () => ({ activePanel, setActivePanel, close }),
    [activePanel, setActivePanel, close],
  );

  return (
    <SidePanelContext.Provider value={value}>
      {children}
    </SidePanelContext.Provider>
  );
}

export default function useSidePanel() {
  return useContext(SidePanelContext);
}
