import React, { useState, useEffect, useRef, useCallback } from "react";
import { Preloader } from "@/components/global/preloader";
import { router } from "@/router";
import { PreloaderContext } from "@/contexts/preloader.context";

interface PreloaderProviderProps {
  children: React.ReactNode;
}

export const PreloaderProvider: React.FC<PreloaderProviderProps> = ({
  children,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isFirstLoad] = useState(false);

  const showTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialReloadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const visibleSinceRef = useRef<number | null>(null);
  const isVisibleRef = useRef(false);
  const isBootLoadingRef = useRef(false);

  const SHOW_DELAY_MS = 120;
  const MIN_VISIBLE_MS = 420;
  const INITIAL_RELOAD_MS = 950;

  const isReloadNavigation = () => {
    if (typeof window === "undefined" || typeof performance === "undefined") {
      return false;
    }

    const navigationEntries = performance.getEntriesByType(
      "navigation",
    ) as PerformanceNavigationTiming[];
    if (navigationEntries.length > 0) {
      return navigationEntries[0].type === "reload";
    }

    const legacyNavigation = (
      performance as Performance & { navigation?: { type?: number } }
    ).navigation;
    return legacyNavigation?.type === 1;
  };

  const clearShowTimeout = useCallback(() => {
    if (!showTimeoutRef.current) return;
    clearTimeout(showTimeoutRef.current);
    showTimeoutRef.current = null;
  }, []);

  const clearHideTimeout = useCallback(() => {
    if (!hideTimeoutRef.current) return;
    clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = null;
  }, []);

  const setVisible = useCallback((value: boolean) => {
    isVisibleRef.current = value;
    setIsVisible(value);
    visibleSinceRef.current = value ? Date.now() : null;
  }, []);

  const beginNavigationLoading = useCallback(() => {
    clearHideTimeout();

    if (isVisibleRef.current || showTimeoutRef.current) {
      return;
    }

    showTimeoutRef.current = setTimeout(() => {
      showTimeoutRef.current = null;
      setVisible(true);
    }, SHOW_DELAY_MS);
  }, [clearHideTimeout, setVisible]);

  const finishNavigationLoading = useCallback(() => {
    clearShowTimeout();

    if (!isVisibleRef.current) {
      return;
    }

    const elapsed = Date.now() - (visibleSinceRef.current ?? Date.now());
    const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);

    if (remaining === 0) {
      setVisible(false);
      return;
    }

    hideTimeoutRef.current = setTimeout(() => {
      hideTimeoutRef.current = null;
      setVisible(false);
    }, remaining);
  }, [clearShowTimeout, setVisible]);

  useEffect(() => {
    const applyNavigationState = () => {
      if (isBootLoadingRef.current) {
        return;
      }

      const navigationState = router.state.navigation.state;
      if (navigationState === "idle") {
        finishNavigationLoading();
      } else {
        beginNavigationLoading();
      }
    };

    if (isReloadNavigation()) {
      isBootLoadingRef.current = true;
      setVisible(true);

      initialReloadTimeoutRef.current = setTimeout(() => {
        initialReloadTimeoutRef.current = null;
        isBootLoadingRef.current = false;
        setVisible(false);
        applyNavigationState();
      }, INITIAL_RELOAD_MS);
    }

    applyNavigationState();
    const unsubscribe = router.subscribe(applyNavigationState);

    return () => {
      unsubscribe();
      clearShowTimeout();
      clearHideTimeout();
      if (initialReloadTimeoutRef.current) {
        clearTimeout(initialReloadTimeoutRef.current);
        initialReloadTimeoutRef.current = null;
      }
      isVisibleRef.current = false;
      isBootLoadingRef.current = false;
    };
  }, [
    beginNavigationLoading,
    finishNavigationLoading,
    clearHideTimeout,
    clearShowTimeout,
    setVisible,
  ]);

  const showPreloader = (duration?: number) => {
    clearShowTimeout();
    clearHideTimeout();
    setVisible(true);

    if (duration) {
      hideTimeoutRef.current = setTimeout(() => {
        hideTimeoutRef.current = null;
        setVisible(false);
      }, duration);
    }
  };

  const hidePreloader = () => {
    clearShowTimeout();
    clearHideTimeout();
    setVisible(false);
  };

  const forceHide = () => {
    clearShowTimeout();
    clearHideTimeout();
    setVisible(false);
  };

  return (
    <PreloaderContext.Provider
      value={{
        showPreloader,
        hidePreloader,
        forceHide,
        isVisible,
        isFirstLoad,
      }}
    >
      {children}
      <Preloader isVisible={isVisible} />
    </PreloaderContext.Provider>
  );
};
