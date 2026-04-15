import React from "react";
import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center space-x-1 text-sm text-muted-foreground", className)}
    >
      <Link
        to="/"
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          {item.href ? (
            <Link
              to={item.href}
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

// Hook để tự động tạo breadcrumb từ router path
export function useBreadcrumb() {
  const location = useLocation();
  const activeTab = new URLSearchParams(location.search).get("tab");

  const getUsersTabLabel = () => {
    if (activeTab === "farmers") return "Nông dân";
    if (activeTab === "supervisors") return "Giám sát viên";
    if (activeTab === "inventory-staff") return "Nhân viên kho";
    return "Users & Roles";
  };
  
  const generateBreadcrumb = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    
    if (pathSegments.length === 0) {
      return [{ label: 'Dashboard' }];
    }
    
    const items: BreadcrumbItem[] = [];
    let currentPath = '';
    
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;
      
      const labelMappings: Record<string, string> = {
        'dashboard': 'Dashboard',
        'user': 'User',
        'system': 'System',
        'users': getUsersTabLabel(),
        'zones': 'Zones',
        'farmers': 'Farmers',
        'plots': 'Plots',
        'contracts': 'Contracts',
        'products': 'Products',
        'categories': 'Categories',
        'orders': 'Orders',
        'reviews': 'Reviews',
      };
      
      const label = labelMappings[segment.toLowerCase()] || 
                    segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
      
      items.push({
        label,
        href: isLast ? undefined : currentPath
      });
    });
    
    return items;
  };
  
  return generateBreadcrumb();
} 