import { Card, CardContent } from "@/components/ui/card";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Outlet } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/custom/sidebar";
import { Navbar } from "@/components/global/navbar";
// import { ThemeProvider } from "@/providers/theme-provider";

const SIDEBAR_STORAGE_KEY = "sidebar_collapsed_state";
const NAVBAR_HEIGHT = 64; // 16 * 4 = 64px (h-16)

const DashboardLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const savedState = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (savedState !== null) {
        try {
          return JSON.parse(savedState);
        } catch (error) {
          console.error(
            "Error parsing sidebar state from localStorage:",
            error
          );
          localStorage.removeItem(SIDEBAR_STORAGE_KEY);
        }
      }
    }
    return false; // Default value
  });

  const isMobile = useIsMobile();
  const clickTimeoutRef = useRef<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Always show sidebar in mock version
  const showSidebar = true;

  // Initialize on mount
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // Save sidebar state to localStorage whenever it changes (only for desktop and after initialization)
  useEffect(() => {
    if (isInitialized && !isMobile && showSidebar) {
      localStorage.setItem(
        SIDEBAR_STORAGE_KEY,
        JSON.stringify(sidebarCollapsed)
      );
    }
  }, [sidebarCollapsed, isMobile, isInitialized, showSidebar]);

  // Handle mobile/desktop transitions
  useEffect(() => {
    if (!isInitialized) return;

    if (isMobile) {
      // Force collapse on mobile
      setSidebarCollapsed(true);
    } else {
      // Restore from localStorage when switching back to desktop
      const savedState = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (savedState !== null) {
        try {
          const isCollapsed = JSON.parse(savedState);
          setSidebarCollapsed(isCollapsed);
        } catch (error) {
          console.error(
            "Error parsing sidebar state from localStorage:",
            error
          );
        }
      }
    }
  }, [isMobile, isInitialized]);

  const handleMenuClick = useCallback(() => {
    // Only handle menu click if sidebar is shown
    if (!showSidebar) return;

    // Debounce to prevent rapid clicks causing lag
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    clickTimeoutRef.current = window.setTimeout(() => {
      setSidebarCollapsed((prev) => !prev);
    }, 50); // Small delay to debounce
  }, [showSidebar]);

  // Handle backdrop click on mobile to close sidebar
  const handleBackdropClick = useCallback(() => {
    if (isMobile && !sidebarCollapsed && showSidebar) {
      setSidebarCollapsed(true);
    }
  }, [isMobile, sidebarCollapsed, showSidebar]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  // Calculate dynamic margins for main content
  const getMainContentMargin = () => {
    if (!showSidebar || isMobile) return 0;
    return sidebarCollapsed ? 64 : 236; // w-16 = 64px, expanded = 236px
  };

  const sidebarVariants = {
    enter: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.2,
      },
    },
    exit: {
      x: isMobile ? -256 : -236,
      opacity: isMobile ? 0 : 1,
      transition: {
        duration: 0.15,
      },
    },
  };

  // Mock layout does not require dynamic content height calc

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Animated Sidebar với AnimatePresence */}
      <AnimatePresence mode="wait">
        {showSidebar && (
          <motion.div
            key="sidebar"
            initial="exit"
            animate="enter"
            exit="exit"
            variants={sidebarVariants}
            className={cn(
              "fixed left-0 top-0 h-full z-50",
              isMobile && "pointer-events-auto"
            )}
          >
            <Sidebar
              collapsed={sidebarCollapsed}
              isMobile={isMobile}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <Navbar
        sidebarCollapsed={sidebarCollapsed}
        isMobile={isMobile}
        onMenuClick={handleMenuClick}
        showSidebar={showSidebar}
      />

      {/* Mobile backdrop overlay - only show if sidebar is visible */}
      <AnimatePresence>
        {isMobile && !sidebarCollapsed && showSidebar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={handleBackdropClick}
          />
        )}
      </AnimatePresence>

      {/* Main content với responsive layout */}
      <motion.main
        className={cn(
          "flex-1 min-h-0 overflow-hidden",
          "px-1"
        )}
        animate={showSidebar && !isMobile ? "managementMode" : "workingMode"}
        variants={
          !isMobile
            ? {
              managementMode: {
                marginLeft: getMainContentMargin(),
                transition: {
                  duration: 0.2,
                  ease: "easeInOut",
                },
              },
              workingMode: {
                marginLeft: 0,
                transition: {
                  duration: 0.2,
                  ease: "easeInOut",
                },
              },
            }
            : undefined
        }
        initial={false}
        style={{
          marginTop: `${NAVBAR_HEIGHT}px`,
          marginLeft: isMobile ? 0 : undefined,
          height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
        }}
      >
        <div
          className={cn(
            "h-full w-full flex flex-col",
            isMobile ? "pt-3 px-3 pb-3" : "pt-2 px-4 pb-4" // Fixed padding to prevent overflow
          )}
        >
          {/* Breadcrumb - flexible height */}

          {/* Content container - đảm bảo chiếm hết không gian còn lại */}
          <motion.div
            className="flex-1 min-h-0 w-full overflow-hidden"
            animate={{ opacity: 1 }}
            transition={{ duration: 0.1 }}
          >
            <Card className="bg-card text-card-foreground rounded-xl border h-full w-full flex flex-col shadow-sm overflow-hidden">
              <CardContent className="flex flex-col min-h-0 p-4 flex-1 overflow-hidden">
                <Outlet />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.main>
    </div>
  );
};

export default DashboardLayout;
