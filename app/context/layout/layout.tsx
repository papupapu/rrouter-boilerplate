import { useCallback, useMemo, useRef, useState } from "react";
import { createContext, useContextSelector } from "use-context-selector";

const LayoutContext = createContext<{
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  contentsRef: React.RefObject<HTMLDivElement | null>;
} | null>(null);

export const LayoutProvider = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const contentsRef = useRef<HTMLDivElement>(null);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const value = useMemo(
    () => ({ sidebarOpen, toggleSidebar, contentsRef }),
    [sidebarOpen, toggleSidebar]
  );

  return (
    <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>
  );
};

export const useLayoutStateIsSidebarOpen = () =>
  useContextSelector(LayoutContext, (value) => value?.sidebarOpen);
export const useLayoutActionsToggleSidebar = () =>
  useContextSelector(LayoutContext, (value) => value?.toggleSidebar);
export const useLayoutContentsRef = () =>
  useContextSelector(LayoutContext, (value) => value?.contentsRef);
