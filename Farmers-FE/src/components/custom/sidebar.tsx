import { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";
import { getSidebarItems } from "@/constants/sidebar.item";
import { ChevronDown, LogOut } from "lucide-react";
import { AppLogo } from "@/components/global/app-logo";
import { useAuthStore } from "@/client/store";
import { clearAllAuthCookies } from "@/lib/cookie-utils";

interface SidebarProps {
  collapsed: boolean;
  isMobile: boolean;
}

interface SidebarGroupProps {
  title: string;
  items: ReturnType<typeof getSidebarItems>;
  collapsed: boolean;
  isMobile: boolean;
  renderMenuItem: (
    item: ReturnType<typeof getSidebarItems>[0],
  ) => React.ReactNode;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  isCollapsible?: boolean;
}

function SidebarGroup({
  title,
  items,
  collapsed,
  renderMenuItem,
  isExpanded,
  onToggleExpanded,
  isCollapsible = true,
}: SidebarGroupProps) {
  const toggleExpanded = () => {
    if (!collapsed && isCollapsible) {
      onToggleExpanded();
    }
  };

  return (
    <div className="px-1 ">
      {!collapsed && (
        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider transition-opacity duration-150">
          {title}
        </div>
      )}

      <motion.div
        animate={{
          height: isExpanded || collapsed ? "auto" : 0,
          opacity: isExpanded || collapsed ? 1 : 0,
        }}
        transition={{
          duration: collapsed ? 0.15 : 0.25,
          ease: collapsed ? [0.4, 0.0, 0.6, 1] : [0.4, 0.0, 0.2, 1],
        }}
        className="overflow-hidden"
      >
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.label}>{renderMenuItem(item)}</div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export function Sidebar({ collapsed, isMobile }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const roleBasePath: "/dashboard" | "/supervisor" =
    location.pathname.startsWith("/supervisor") ? "/supervisor" : "/dashboard";

  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isGroupOpen] = useState(true);

  const menuItems = useMemo(
    () => getSidebarItems(roleBasePath),
    [roleBasePath],
  );
  const filteredMainItems = menuItems.filter(
    (item) => item.category === "main",
  );
  const filteredManagementItems = menuItems.filter(
    (item) => item.category === "management",
  );
  const filteredSystemItems = menuItems.filter(
    (item) => item.category === "system",
  );

  const { user, logout } = useAuthStore();

  const avatarUrl = user?.avatarUrl ?? "";
  const isDefault = !avatarUrl;

  const handleLogout = () => {
    clearAllAuthCookies();
    logout();
    localStorage.removeItem("ec_cart");
    const loginPath = location.pathname.startsWith("/supervisor")
      ? "/supervisor/login"
      : "/admin/login";
    navigate(loginPath, { replace: true });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleMenuItemClick = (path: string) => {
    navigate(path);
  };

  const renderMenuItem = (item: (typeof menuItems)[0]) => {
    const isActive =
      location.pathname === item.path ||
      (item.path === "/" && location.pathname === "/");

    const menuButton = (
      <Button
        key={item.label}
        variant="ghost"
        size={collapsed ? "icon" : "sm"}
        className={cn(
          "w-full group relative will-change-transform",
          "transition-all duration-200 ease-in-out rounded-md border border-white/25 border-l-4",
          collapsed ? "h-9 px-0" : "justify-start h-9 px-3",
          isActive
            ? "border-l-primary bg-linear-to-r from-primary/22 via-primary/12 to-transparent text-black hover:from-primary/28 hover:via-primary/14 hover:to-transparent hover:text-black"
            : "border-l-transparent bg-transparent text-black/80 hover:bg-primary/12 hover:text-black",
          !collapsed && "text-sm font-medium",
        )}
        onClick={() => handleMenuItemClick(item.path)}
        onMouseEnter={() => setHoveredItem(item.label)}
        onMouseLeave={() => setHoveredItem(null)}
      >
        <item.icon className={cn("h-4 w-4 shrink-0", !collapsed && "mr-2")} />

        {!collapsed && (
          <span className="truncate transition-opacity duration-150">
            {item.label}
          </span>
        )}

        {/* Tooltip for collapsed state */}
        {collapsed && hoveredItem === item.label && !isMobile && (
          <div className="absolute left-full ml-3 px-3 py-2 bg-popover text-popover-foreground text-sm rounded-md whitespace-nowrap z-50 shadow-md border border-border animate-in fade-in-0 zoom-in-95 duration-150">
            {item.label}
          </div>
        )}
      </Button>
    );

    if (collapsed && !isMobile) {
      return (
        <TooltipProvider key={item.label}>
          <Tooltip>
            <TooltipTrigger asChild>{menuButton}</TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              {item.label}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return menuButton;
  };

  // Animation variants cho sidebar width - tối ưu cho mượt mà hơn
  const sidebarVariants = {
    expanded: {
      width: isMobile ? 256 : 236, // desktop width increased ~7%
      opacity: 1,
      x: 0,
      transition: {
        width: {
          duration: 0.25,
          ease: [0.4, 0.0, 0.2, 1] as [number, number, number, number],
        },
        opacity: {
          duration: 0.2,
          ease: [0.4, 0.0, 0.2, 1] as [number, number, number, number],
        },
        x: {
          duration: 0.25,
          ease: [0.4, 0.0, 0.2, 1] as [number, number, number, number],
        },
      },
    },
    collapsed: {
      width: isMobile ? 256 : 64, // Keep width on mobile for proper animation
      opacity: isMobile ? 0 : 1,
      x: isMobile ? -256 : 0, // Slide out on mobile
      transition: {
        width: {
          duration: 0.18,
          ease: [0.4, 0.0, 0.6, 1] as [number, number, number, number], // Ease out nhanh hơn khi collapse
        },
        opacity: {
          duration: 0.12,
          ease: [0.4, 0.0, 0.6, 1] as [number, number, number, number],
        },
        x: {
          duration: 0.18,
          ease: [0.4, 0.0, 0.6, 1] as [number, number, number, number],
        },
      },
    },
  };

  const [isImageLoaded, setIsImageLoaded] = useState(false);

  return (
    <motion.div
      className={cn(
        "bg-card border-r border-border flex flex-col will-change-transform",
        isMobile
          ? "fixed left-0 top-0 h-full z-50 shadow-lg"
          : "relative h-full z-30",
        isMobile && collapsed && "pointer-events-none",
      )}
      animate={collapsed ? "collapsed" : "expanded"}
      variants={sidebarVariants}
      initial={false}
      style={isMobile && collapsed ? { visibility: "hidden" } : undefined}
    >
      {/* Header */}
      <div className="flex items-center justify-center px-2 py-1 bg-card/50 overflow-visible">
        {!collapsed && (
          <div className="flex items-center justify-center w-full transition-opacity duration-150">
            <AppLogo height={120} />
          </div>
        )}
        {collapsed && !isMobile && (
          <div className="flex justify-center flex-1">
            <AppLogo height={64} />
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full overflow-y-auto overflow-x-hidden space-y-2 pt-1 pb-3">
          {/* Main Navigation Group */}
          {filteredMainItems.length > 0 && (
            <SidebarGroup
              title="Main"
              items={filteredMainItems}
              collapsed={collapsed}
              isMobile={isMobile}
              renderMenuItem={renderMenuItem}
              isExpanded={isGroupOpen}
              onToggleExpanded={() => undefined}
              isCollapsible={false}
            />
          )}

          {filteredMainItems.length > 0 &&
            (filteredManagementItems.length > 0 ||
              filteredSystemItems.length > 0) && <Separator className="mx-3" />}

          {filteredManagementItems.length > 0 && (
            <SidebarGroup
              title="Manager"
              items={filteredManagementItems}
              collapsed={collapsed}
              isMobile={isMobile}
              renderMenuItem={renderMenuItem}
              isExpanded={isGroupOpen}
              onToggleExpanded={() => undefined}
              isCollapsible={false}
            />
          )}
          {filteredManagementItems.length > 0 &&
            filteredSystemItems.length > 0 && <Separator className="mx-3" />}

          {filteredSystemItems.length > 0 && (
            <SidebarGroup
              title="E-commerce"
              items={filteredSystemItems}
              collapsed={collapsed}
              isMobile={isMobile}
              renderMenuItem={renderMenuItem}
              isExpanded={isGroupOpen}
              onToggleExpanded={() => undefined}
              isCollapsible={false}
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border bg-card/50 p-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center ring-2 ring-background shrink-0">
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
          </div>

          {!collapsed && (
            <div className="flex-1 min-w-0 transition-opacity duration-150">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.fullName || "User"}
              </p>

              <p className="text-xs text-muted-foreground truncate">
                {user?.phone || user?.email || "No info"}
              </p>
              <Badge
                variant="secondary"
                className="font-medium text-xs px-2 py-0"
              >
                {user?.role || "Member"}
              </Badge>
            </div>
          )}

          {!collapsed && (
            <div className="transition-opacity duration-150">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors duration-200"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {collapsed && !isMobile && (
          <div className="transition-opacity duration-150">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="w-full h-8 mt-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors duration-200"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  Sign out
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {collapsed && isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="w-full h-8 mt-2 text-muted-foreground hover:text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}
