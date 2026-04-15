export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatar: string | null;
  role: 'ADMIN' | 'SUPERVISOR' | 'INVENTORY' | 'CLIENT';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
  adminProfile?: { id: string; businessName: string; province: string } | null;
  supervisorProfile?: { id: string; employeeCode: string; adminId: string } | null;
  clientProfile?: { id: string; province: string | null; defaultAddress: string | null } | null;
}

export interface PaginatedUsersResponse {
  data: UserResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
