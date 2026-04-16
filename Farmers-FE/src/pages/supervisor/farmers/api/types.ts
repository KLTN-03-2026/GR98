import type { ApiSuccessResponse } from '@/client/lib/api-client';

export type FarmerStatus = 'ACTIVE' | 'INACTIVE';

export interface FarmerResponse {
  id: string;
  adminId: string;
  fullName: string;
  phone: string;
  cccd: string;
  bankAccount: string | null;
  address: string | null;
  province: string | null;
  status: FarmerStatus;
  createdAt: string;
  supervisorId: string | null;
  supervisor: {
    id: string;
    employeeCode: string;
    user: {
      id: string;
      fullName: string;
      status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    };
  } | null;
  _count: {
    plots: number;
    contracts: number;
  };
}

export interface PaginatedFarmersResponse {
  data: FarmerResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type { ApiSuccessResponse };
