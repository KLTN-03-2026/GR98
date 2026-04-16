import apiClient from './apiClient';

export interface LoginRequest {
  email: string;
  password: string;
}

// Khớp với schema Prisma - User model
export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  avatar?: string | null;
  role: 'ADMIN' | 'SUPERVISOR' | 'INVENTORY' | 'CLIENT';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
}

// Thông tin mở rộng của Supervisor
export interface SupervisorProfile {
  id: string;
  userId: string;
  adminId: string;
  zoneId?: string | null;
  employeeCode: string;
  hiredAt: string;
  lat?: number | null;
  lng?: number | null;
  lastSeenAt?: string | null;
}

// Response từ API login
export interface LoginResponse {
  access_token: string;
  user: User;
  supervisorProfile?: SupervisorProfile;
}

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/auth/login', data);
  
  if (response.data.access_token) {
    localStorage.setItem('token', response.data.access_token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    
    // Lưu thêm supervisor profile nếu có
    if (response.data.supervisorProfile) {
      localStorage.setItem('supervisorProfile', JSON.stringify(response.data.supervisorProfile));
    }
  }
  
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('supervisorProfile');
  window.location.href = '/login';
};

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
};

export const getSupervisorProfile = (): SupervisorProfile | null => {
  const profileStr = localStorage.getItem('supervisorProfile');
  if (!profileStr) return null;
  try {
    return JSON.parse(profileStr) as SupervisorProfile;
  } catch {
    return null;
  }
};

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('token');
};

export const isSupervisor = (): boolean => {
  const user = getCurrentUser();
  return user?.role === 'SUPERVISOR';
};

export const isAdmin = (): boolean => {
  const user = getCurrentUser();
  return user?.role === 'ADMIN';
};
