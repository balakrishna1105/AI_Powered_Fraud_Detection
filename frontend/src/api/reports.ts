import { apiClient } from './client';
import type { ReportJob, ReportType, PaginatedData } from '../types';

export const reportsApi = {
  generateReport: async (data: {
    title: string;
    report_type: ReportType;
    filters?: Record<string, any>;
    file_format?: string;
  }): Promise<ReportJob> => {
    return apiClient<ReportJob>('/reports/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  listReports: async (page: number = 1, page_size: number = 20): Promise<PaginatedData<ReportJob>> => {
    return apiClient<PaginatedData<ReportJob>>(`/reports?page=${page}&page_size=${page_size}`);
  },

  getReport: async (reportId: string): Promise<ReportJob> => {
    return apiClient<ReportJob>(`/reports/${reportId}`);
  },

  getDownloadUrl: (reportId: string): string => {
    const token = localStorage.getItem('hg_auth_token');
    return `/api/v1/reports/${reportId}/download?token=${token || ''}`;
  },
};
