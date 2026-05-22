import { createContext, useCallback, useContext, useState } from "react";

const SidePanelContext = createContext({
  activePanel: null,
  setActivePanel: () => {},
  close: () => {},
});

export function SidePanelProvider({ children }) {
  const [activePanel, setActivePanelState] = useState(null);
  const setActivePanel = useCallback((panel) => setActivePanelState(panel), []);
  const close = useCallback(() => setActivePanelState(null), []);
  return (
    <SidePanelContext.Provider value={{ activePanel, setActivePanel, close }}>
      {children}
    </SidePanelContext.Provider>
  );
}

export default function useSidePanel() {
  return useContext(SidePanelContext);
}
