import type { ApiSuccessResponse } from '@/client/lib/api-client';

export interface InventoryStaffResponse {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatar: string | null;
  role: 'INVENTORY';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
  inventoryProfile: {
    id: string;
    employeeCode: string;
    adminId: string;
    hiredAt: string;
    _count: {
      warehouses: number;
    };
    warehouses: Array<{
      id: string;
      name: string;
    }>;
  } | null;
}

export interface PaginatedInventoryStaffResponse {
  data: InventoryStaffResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type { ApiSuccessResponse };
