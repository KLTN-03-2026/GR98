import {
    BookOpenCheck,
    Boxes,
    ClipboardList,
    FileSpreadsheet,
    Handshake,
    LayoutDashboard,
    MapPinned,
    Package,
    ReceiptText,
    ScanSearch,
    ShieldCheck,
    Sprout,
    Users,
    Warehouse,
    Layers,
    ArrowRightLeft,
    PieChart,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type SidebarCategory = 'main' | 'people' | 'management' | 'system';

export type SidebarItem = {
    icon: LucideIcon;
    label: string;
    category: SidebarCategory;
    path: string;
};

export const getSidebarItems = (basePath: '/dashboard' | '/supervisor' | '/inventory'): SidebarItem[] => {
    const commonMainItems: SidebarItem[] = [
        { icon: LayoutDashboard, label: 'Tổng quan', category: 'management', path: `${basePath}/overview` },
    ];

    if (basePath === '/dashboard') {
        return [
            ...commonMainItems,

            // Identity & Access (People Management)
            { icon: ShieldCheck, label: 'Quản lý Tài khoản', category: 'people', path: `${basePath}/users` },
            { icon: Users, label: 'Nông dân', category: 'people', path: `${basePath}/farmers` },
            
            // HRM & Business Area
            { icon: MapPinned, label: 'Quản lý Vùng trồng', category: 'management', path: `${basePath}/zones` },
            { icon: Sprout, label: 'Quản lý Lô đất', category: 'management', path: `${basePath}/plots` },
            { icon: ClipboardList, label: 'Quản lý hợp đồng', category: 'management', path: `${basePath}/contracts` },
            { icon: FileSpreadsheet, label: 'Báo cáo hằng ngày', category: 'management', path: `${basePath}/daily-reports` },

            // Contract & Monitoring
            { icon: Warehouse, label: 'Giám sát Kho hàng', category: 'system', path: `${basePath}/warehouses` },
            { icon: ReceiptText, label: 'Đơn hàng & Thanh toán', category: 'system', path: `${basePath}/orders` },
        ];
    }

    if (basePath === '/supervisor') {
        return [
            ...commonMainItems,
            
            // People
            { icon: Users, label: 'Nông dân', category: 'people', path: `${basePath}/farmers` },

            // Management
            { icon: MapPinned, label: 'Quản lý vùng trồng', category: 'management', path: `${basePath}/zones` },
            { icon: Sprout, label: 'Lô đất phụ trách', category: 'management', path: `${basePath}/plots` },
            { icon: FileSpreadsheet, label: 'Báo cáo hàng ngày', category: 'management', path: `${basePath}/daily-reports` },
            { icon: ScanSearch, label: 'Phân tích cây trồng AI', category: 'management', path: `${basePath}/ai-analysis` },
            
            // Contracts (System)
            { icon: Handshake, label: 'Hợp đồng liên kết', category: 'system', path: `${basePath}/contracts` },
        ];
    }

    // Inventory Manager items
    return [
        ...commonMainItems,
        { icon: Warehouse, label: 'Quản lý Kho', category: 'management', path: `${basePath}/warehouses` },
        { icon: Layers, label: 'Quản lý Lô hàng', category: 'management', path: `${basePath}/lots` },
        { icon: ArrowRightLeft, label: 'Ghi nhận Xuất/Nhập', category: 'management', path: `${basePath}/transactions` },
        { icon: PieChart, label: 'Quản lý Cung cầu', category: 'management', path: `${basePath}/supply-demand` },

        { icon: Package, label: 'Sản phẩm (ECM)', category: 'system', path: `${basePath}/products` },
        { icon: Boxes, label: 'Danh mục', category: 'system', path: `${basePath}/categories` },
        { icon: ReceiptText, label: 'Đơn hàng & Thanh toán', category: 'system', path: `${basePath}/orders` },
        { icon: BookOpenCheck, label: 'Bảng giá', category: 'system', path: `${basePath}/price-boards` },
        { icon: BookOpenCheck, label: 'Reviews', category: 'system', path: `${basePath}/reviews` },
        { icon: Users, label: 'Khách hàng (ECM)', category: 'system', path: `${basePath}/clients` },
    ];
};
