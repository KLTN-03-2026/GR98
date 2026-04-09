import {
    BookOpenCheck,
    Boxes,
    ClipboardList,
    FileSpreadsheet,
    Handshake,
    LayoutGrid,
    LayoutDashboard,
    MapPinned,
    Package,
    ReceiptText,
    ShieldCheck,
    ShoppingBag,
    Sprout,
    Star,
    Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type SidebarCategory = 'main' | 'management' | 'system';

export type SidebarItem = {
    icon: LucideIcon;
    label: string;
    category: SidebarCategory;
    path: string;
};

export const getSidebarItems = (basePath: '/dashboard' | '/supervisor'): SidebarItem[] => {
    const commonMainItems: SidebarItem[] = [
        { icon: ShoppingBag, label: 'Cửa hàng', category: 'main', path: '/' },
        { icon: LayoutDashboard, label: 'Dashboard', category: 'management', path: `${basePath}/overview` },
    ];

    if (basePath === '/dashboard') {
        return [
            ...commonMainItems,

            // Identity & Access
            { icon: ShieldCheck, label: 'Users & Roles', category: 'management', path: `${basePath}/users` },

            // HRM & Business Area
            { icon: MapPinned, label: 'Zones', category: 'management', path: `${basePath}/zones` },
            { icon: Users, label: 'Farmers', category: 'management', path: `${basePath}/farmers` },
            { icon: Sprout, label: 'Plots', category: 'management', path: `${basePath}/plots` },
            { icon: ClipboardList, label: 'Assignments', category: 'management', path: `${basePath}/assignments` },
            { icon: FileSpreadsheet, label: 'Daily Reports', category: 'management', path: `${basePath}/daily-reports` },
            { icon: BookOpenCheck, label: 'Price Boards', category: 'management', path: `${basePath}/price-boards` },

            // Contract & E-commerce
            { icon: Handshake, label: 'Contracts', category: 'system', path: `${basePath}/contracts` },
            { icon: Package, label: 'Products', category: 'system', path: `${basePath}/products` },
            { icon: Boxes, label: 'Categories', category: 'system', path: `${basePath}/categories` },
            { icon: ReceiptText, label: 'Orders', category: 'system', path: `${basePath}/orders` },
            { icon: Star, label: 'Reviews', category: 'system', path: `${basePath}/reviews` },
            { icon: LayoutGrid, label: 'Components', category: 'system', path: `${basePath}/components` },
        ];
    }

    return [
        ...commonMainItems,
        { icon: Sprout, label: 'Plots', category: 'management', path: `${basePath}/plots` },
        { icon: Handshake, label: 'Contracts', category: 'management', path: `${basePath}/contracts` },
        { icon: FileSpreadsheet, label: 'Daily Reports', category: 'management', path: `${basePath}/daily-reports` },
    ];
};