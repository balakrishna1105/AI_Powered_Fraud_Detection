import { apiClient } from './client';
import type { AuditLog, Notification, SystemSetting, PaginatedData } from '../types';

export const auditApi = {
  getAuditLogs: async (params: {
    page?: number;
    page_size?: number;
    user_email?: string;
    action?: string;
    resource?: string;
    resource_id?: string;
  } = {}): Promise<PaginatedData<AuditLog>> => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.page_size) query.append('page_size', params.page_size.toString());
    if (params.user_email) query.append('user_email', params.user_email);
    if (params.action) query.append('action', params.action);
    if (params.resource) query.append('resource', params.resource);
    if (params.resource_id) query.append('resource_id', params.resource_id);

    return apiClient<PaginatedData<AuditLog>>(`/audit-logs?${query.toString()}`);
  },

  getNotifications: async (limit: number = 20): Promise<Notification[]> => {
    return apiClient<Notification[]>(`/notifications?limit=${limit}`);
  },

  markNotificationRead: async (notifId: string): Promise<{ read: boolean }> => {
    return apiClient<{ read: boolean }>(`/notifications/${notifId}/read`, {
      method: 'PATCH',
    });
  },

  getUnreadCount: async (): Promise<{ unread_count: number }> => {
    return apiClient<{ unread_count: number }>('/notifications/unread-count');
  },

  getSettings: async (): Promise<SystemSetting[]> => {
    return apiClient<SystemSetting[]>('/settings');
  },

  updateSetting: async (key: string, value: string, description?: string): Promise<SystemSetting> => {
    return apiClient<SystemSetting>(`/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value, description }),
    });
  },
};
