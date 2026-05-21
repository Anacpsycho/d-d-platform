import { create } from 'zustand';
import { User } from '../types/auth.types';
import { authService } from '../services/auth.service';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),

  login: async (usernameOrEmail, password) => {
    try {
      set({ isLoading: true, error: null });
      const response = await authService.login({ usernameOrEmail, password });
      set({ user: response.user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  register: async (username, email, password) => {
    try {
      set({ isLoading: true, error: null });
      const response = await authService.register({ username, email, password });
      set({ user: response.user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true });
      await authService.logout();
      set({ user: null, isAuthenticated: false, isLoading: false, error: null });
    } catch (error: any) {
      set({ isLoading: false });
      // Still clear user data even if API call fails
      set({ user: null, isAuthenticated: false, error: null });
    }
  },

  checkAuth: async () => {
    try {
      if (!authService.isAuthenticated()) {
        set({ user: null, isAuthenticated: false });
        return;
      }

      set({ isLoading: true });
      const user = await authService.getCurrentUser();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

// Made with Bob
