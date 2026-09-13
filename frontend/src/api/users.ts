import { apiClient } from './client';
import type { User, UserRole, UserStatus, PaginatedData } from '../types';

export interface UserCreateInput {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  department?: string;
  status?: UserStatus;
}

export interface UserUpdateInput {
  first_name?: string;
  last_name?: string;
  role?: UserRole;
  department?: string;
  status?: UserStatus;
}

export const usersApi = {
  getUsers: async (params: {
    page?: number;
    page_size?: number;
    search?: string;
    role?: UserRole;
    status?: UserStatus;
  } = {}): Promise<PaginatedData<User>> => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.page_size) query.append('page_size', params.page_size.toString());
    if (params.search) query.append('search', params.search);
    if (params.role) query.append('role', params.role);
    if (params.status) query.append('status', params.status);

    return apiClient<PaginatedData<User>>(`/users?${query.toString()}`);
  },

  getUserById: async (userId: string): Promise<User> => {
    return apiClient<User>(`/users/${userId}`);
  },

  createUser: async (data: UserCreateInput): Promise<User> => {
    return apiClient<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateUser: async (userId: string, data: UserUpdateInput): Promise<User> => {
    return apiClient<User>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  updateStatus: async (userId: string, status: UserStatus): Promise<User> => {
    return apiClient<User>(`/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  resetPassword: async (userId: string, new_password: string): Promise<{ reset: boolean }> => {
    return apiClient<{ reset: boolean }>(`/users/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ new_password }),
    });
  },

  deleteUser: async (userId: string): Promise<{ deleted: boolean }> => {
    return apiClient<{ deleted: boolean }>(`/users/${userId}`, {
      method: 'DELETE',
    });
  },
};
