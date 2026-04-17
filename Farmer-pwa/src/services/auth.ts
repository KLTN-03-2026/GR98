import apiClient from './apiClient';

export interface LoginRequest {
  email: string;
  password: string;
}

// Khớp với response thực tế của backend
export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  avatar?: string | null;
  role: 'ADMIN' | 'SUPERVISOR' | 'INVENTORY' | 'CLIENT';
  createdAt: string;
  adminProfile?: AdminProfile | null;
  supervisorProfile?: SupervisorProfile | null;
  clientProfile?: ClientProfile | null;
}

export interface AdminProfile {
  id: string;
  businessName?: string;
  province?: string;
  taxCode?: string;
  bankAccount?: string;
}

export interface SupervisorProfile {
  id: string;
  employeeCode: string;
  adminId: string;
  zoneId?: string | null;
}

export interface ClientProfile {
  id: string;
  province?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/auth/login', data);
  // Backend wraps in { success: true, data: {...} } via TransformResponseInterceptor
  const payload = response.data.data ?? response.data;

  if (payload.accessToken) {
    localStorage.setItem('token', payload.accessToken);
    localStorage.setItem('user', JSON.stringify(payload.user));
    if (payload.user?.supervisorProfile) {
      localStorage.setItem('supervisorProfile', JSON.stringify(payload.user.supervisorProfile));
    }
  }

  return payload as LoginResponse;
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
