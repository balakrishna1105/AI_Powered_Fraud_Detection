import { apiClient } from './client';
import type { User } from '../types';

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    return apiClient<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  getCurrentUser: async (): Promise<User> => {
    return apiClient<User>('/auth/me');
  },

  logout: async (): Promise<{ logged_out: boolean }> => {
    return apiClient<{ logged_out: boolean }>('/auth/logout', {
      method: 'POST',
    });
  },
};
