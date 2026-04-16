import { create } from 'zustand';
import type { User, SupervisorProfile } from '../services/auth';

interface AuthState {
  user: User | null;
  supervisorProfile: SupervisorProfile | null;
  isAuthenticated: boolean;
  setUser: (user: User | null, supervisorProfile?: SupervisorProfile | null) => void;
  logout: () => void;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  supervisorProfile: null,
  isAuthenticated: false,

  setUser: (user, supervisorProfile = null) => {
    set({ user, supervisorProfile, isAuthenticated: !!user });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('supervisorProfile');
    set({ user: null, supervisorProfile: null, isAuthenticated: false });
    window.location.href = '/login';
  },

  initAuth: () => {
    const userStr = localStorage.getItem('user');
    const profileStr = localStorage.getItem('supervisorProfile');
    const token = localStorage.getItem('token');
    
    if (userStr && token) {
      try {
        const user = JSON.parse(userStr) as User;
        let supervisorProfile: SupervisorProfile | null = null;
        
        if (profileStr) {
          supervisorProfile = JSON.parse(profileStr) as SupervisorProfile;
        }
        
        set({ user, supervisorProfile, isAuthenticated: true });
      } catch {
        set({ user: null, supervisorProfile: null, isAuthenticated: false });
      }
    } else {
      set({ user: null, supervisorProfile: null, isAuthenticated: false });
    }
  },
}));
