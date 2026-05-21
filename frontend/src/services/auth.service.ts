import api from './api';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  RefreshTokenRequest,
  PasswordResetRequest,
  User,
} from '../types/auth.types';

export const authService = {
  // Login
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    const { accessToken, refreshToken } = response.data;
    
    // Store tokens
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    return response.data;
  },

  // Register
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', userData);
    const { accessToken, refreshToken } = response.data;
    
    // Store tokens
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    return response.data;
  },

  // Logout
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      // Clear tokens regardless of API response
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  },

  // Refresh token
  async refreshToken(data: RefreshTokenRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/refresh', data);
    const { accessToken } = response.data;
    
    // Update access token
    localStorage.setItem('accessToken', accessToken);
    
    return response.data;
  },

  // Get current user
  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  // Request password reset
  async requestPasswordReset(data: PasswordResetRequest): Promise<void> {
    await api.post('/auth/password-reset', data);
  },

  // Confirm password reset
  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    await api.post('/auth/password-reset/confirm', { token, newPassword });
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  },

  // Get stored access token
  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  },

  // Get stored refresh token
  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  },
};

// Made with Bob
