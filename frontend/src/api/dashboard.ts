import { apiClient } from './client';
import type {
  DashboardSummary,
  FraudTrend,
  FraudByCategory,
  FraudByRegion,
  TopProvider,
  HighPriorityAlert,
} from '../types';

export const dashboardApi = {
  getSummary: async (): Promise<DashboardSummary> => {
    return apiClient<DashboardSummary>('/dashboard/summary');
  },

  getFraudTrends: async (period: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<FraudTrend[]> => {
    return apiClient<FraudTrend[]>(`/dashboard/fraud-trends?period=${period}`);
  },

  getFraudByCategory: async (): Promise<FraudByCategory[]> => {
    return apiClient<FraudByCategory[]>('/dashboard/fraud-by-category');
  },

  getFraudByRegion: async (): Promise<FraudByRegion[]> => {
    return apiClient<FraudByRegion[]>('/dashboard/fraud-by-region');
  },

  getTopProviders: async (): Promise<TopProvider[]> => {
    return apiClient<TopProvider[]>('/dashboard/top-providers');
  },

  getHighPriorityAlerts: async (limit: number = 10): Promise<HighPriorityAlert[]> => {
    return apiClient<HighPriorityAlert[]>(`/dashboard/high-priority-alerts?limit=${limit}`);
  },
};
