import type { ApiSuccessResponse } from '@/client/lib/api-client';

export interface SupervisorResponse {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatar: string | null;
  role: 'SUPERVISOR';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
  supervisorProfile: {
    id: string;
    employeeCode: string;
    adminId: string;
    zoneId: string | null;
    hiredAt: string;
    lat: number | null;
    lng: number | null;
    lastSeenAt: string | null;
    zone: {
      id: string;
      name: string;
      province: string;
      district: string;
    } | null;
    _count: {
      assignments: number;
      dailyReports: number;
      farmers: number;
    };
  } | null;
}

export interface PaginatedSupervisorsResponse {
  data: SupervisorResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type { ApiSuccessResponse };
