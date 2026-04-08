import { createContext, useContext } from "react";

export interface PreloaderContextType {
  showPreloader: (duration?: number) => void;
  hidePreloader: () => void;
  forceHide: () => void;
  isVisible: boolean;
  isFirstLoad: boolean;
}

export const PreloaderContext = createContext<PreloaderContextType | undefined>(
  undefined,
);

export const usePreloader = () => {
  const context = useContext(PreloaderContext);
  if (!context) {
    throw new Error("usePreloader must be used within a PreloaderProvider");
  }
  return context;
};
