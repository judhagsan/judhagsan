import { createContext, useCallback, useContext, useState } from "react";

const PrivacyPanelContext = createContext({
  isOpen: false,
  open: () => {},
  close: () => {},
});

export function PrivacyPanelProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  return (
    <PrivacyPanelContext.Provider value={{ isOpen, open, close }}>
      {children}
    </PrivacyPanelContext.Provider>
  );
}

export default function usePrivacyPanel() {
  return useContext(PrivacyPanelContext);
}
