import {
  Bell,
  User,
  Settings,
  Menu,
  LogOut,
  Maximize,
  Minimize,
  PanelLeft,
  PanelLeftClose,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
// import { ModeToggle } from '@/components/custom/mode-toggle';
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, useBreadcrumb } from "@/components/ui/breadcrumb";
import { useAuthStore } from "@/client/store";
import { clearAllAuthCookies } from "@/lib/cookie-utils";
import { toast } from "sonner";

interface NavbarProps {
  sidebarCollapsed: boolean;
  isMobile: boolean;
  onMenuClick: () => void;
  showSidebar: boolean;
}

export function Navbar({
  sidebarCollapsed,
  isMobile,
  onMenuClick,
  showSidebar,
}: NavbarProps) {
  const breadcrumbItems = useBreadcrumb();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  // Avatar state - moved here to avoid hooks after early return
  const DEFAULT_AVATAR_URL =
    "https://img.freepik.com/free-psd/3d-illustration-human-avatar-profile_23-2150671142.jpg?semt=ais_hybrid&w=740";
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // Check fullscreen status on mount and listen for changes
  useEffect(() => {
    const checkFullscreen = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    checkFullscreen();
    document.addEventListener("fullscreenchange", checkFullscreen);

    return () => {
      document.removeEventListener("fullscreenchange", checkFullscreen);
    };
  }, []);

  const handleLogout = () => {
    clearAllAuthCookies();
    logout();
    localStorage.removeItem("ec_cart");
    toast.success("Đã đăng xuất");
    const loginPath = location.pathname.startsWith("/supervisor")
      ? "/supervisor/login"
      : location.pathname.startsWith("/dashboard")
        ? "/admin/login"
        : "/auth/login";
    navigate(loginPath, { replace: true });
  };

  const handleProfileClick = () => {
    navigate("/user");
  };

  const handleSettingsClick = () => {
    navigate("/system/basic");
  };

  // Animation variants cho navbar positioning
  const navbarVariants = {
    managementMode: {
      left: isMobile ? 0 : sidebarCollapsed ? 64 : 236,
      width: isMobile
        ? "100%"
        : sidebarCollapsed
          ? "calc(100% - 4rem)"
          : "calc(100% - 236px)",
      transition: {
        duration: 0.2,
        ease: "easeOut" as const,
      },
    },
    workingMode: {
      left: 0,
      width: "100%",
      transition: {
        duration: 0.2,
        ease: "easeOut" as const,
      },
    },
  } as const;

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error);
    }
  };

  // Generate initials from user's full name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const avatarUrl = user?.avatarUrl || DEFAULT_AVATAR_URL;
  const isDefault = !user?.avatarUrl || user.avatarUrl === DEFAULT_AVATAR_URL;

  return (
    <motion.nav
      className={cn(
        "fixed top-0 bg-background/80 backdrop-blur-sm border-b border-border will-change-auto",
        isMobile ? "z-30 left-0 right-0" : "z-40",
      )}
      animate={showSidebar && !isMobile ? "managementMode" : "workingMode"}
      variants={!isMobile ? navbarVariants : undefined}
      initial={false}
      style={isMobile ? { width: "100%", left: 0 } : undefined}
    >
      <div className="flex items-center justify-between px-3 md:px-6 h-14">
        {/* Left Side */}
        <div className="flex items-center space-x-3">
          <AnimatePresence mode="wait">
            {showSidebar && !isMobile && (
              <motion.div
                key="sidebar-toggle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onMenuClick}
                  className="shrink-0"
                >
                  {sidebarCollapsed ? (
                    <PanelLeft className="h-5 w-5" />
                  ) : (
                    <PanelLeftClose className="h-5 w-5" />
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {showSidebar && !isMobile && (
              <motion.div
                key="breadcrumb"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="shrink-0"
              >
                <Breadcrumb items={breadcrumbItems} />
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence mode="wait">
            {isMobile && showSidebar && (
              <motion.div
                key="menu-button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onMenuClick}
                  className="shrink-0"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-1 md:space-x-3 shrink-0">
          <div className="flex items-center space-x-2 border-r border-l">
            <div className="ms-1"></div>

            {/* Fullscreen Toggle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFullscreen}
                    className="relative"
                  >
                    {isFullscreen ? (
                      <Minimize className="h-5 w-5" />
                    ) : (
                      <Maximize className="h-5 w-5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Theme Toggle */}
            {/* <ModeToggle /> */}
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <div className="flex flex-col space-y-1">
                    <span className="font-medium">New user registered</span>
                    <span className="text-sm text-muted-foreground">
                      2 minutes ago
                    </span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <div className="flex flex-col space-y-1">
                    <span className="font-medium">
                      Server maintenance scheduled
                    </span>
                    <span className="text-sm text-muted-foreground">
                      1 hour ago
                    </span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <div className="flex flex-col space-y-1">
                    <span className="font-medium">
                      Database backup completed
                    </span>
                    <span className="text-sm text-muted-foreground">
                      3 hours ago
                    </span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Separator */}
            <Separator orientation="vertical" className="h-6" />
          </div>

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-full"
              >
                <Avatar className="h-8 w-8 relative">
                  {!isDefault && !isImageLoaded && (
                    <Skeleton className="absolute w-full h-full rounded-full" />
                  )}
                  <AvatarImage
                    className={`${user?.avatarUrl ? "object-cover w-full h-full" : ""}`}
                    src={avatarUrl}
                    alt="User"
                    onLoad={() => setIsImageLoaded(true)}
                    onError={() => setIsImageLoaded(false)}
                    style={{
                      display: isDefault || isImageLoaded ? "block" : "none",
                    }}
                  />
                  <AvatarFallback className="text-xs">
                    {user ? getInitials(user.fullName) : "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.fullName || "User"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.phone || user?.email || "—"}
                  </p>
                  <Badge
                    variant="secondary"
                    className="font-medium text-xs px-2 py-0"
                  >
                    {user?.role ?? "Khách"}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleProfileClick}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSettingsClick}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-rose-400 focus:text-rose-400"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.nav>
  );
}
