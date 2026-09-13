import { apiClient } from './client';
import type { Provider, ProviderDetail, Member, MemberDetail, PaginatedData } from '../types';

export const providersApi = {
  getProviders: async (params: {
    page?: number;
    page_size?: number;
    search?: string;
    state?: string;
    min_risk?: number;
  } = {}): Promise<PaginatedData<Provider>> => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.page_size) query.append('page_size', params.page_size.toString());
    if (params.search) query.append('search', params.search);
    if (params.state) query.append('state', params.state);
    if (params.min_risk !== undefined) query.append('min_risk', params.min_risk.toString());

    return apiClient<PaginatedData<Provider>>(`/providers?${query.toString()}`);
  },

  getProviderDetail: async (providerId: string): Promise<ProviderDetail> => {
    return apiClient<ProviderDetail>(`/providers/${providerId}`);
  },
};

export const membersApi = {
  getMembers: async (params: {
    page?: number;
    page_size?: number;
    search?: string;
    min_risk?: number;
  } = {}): Promise<PaginatedData<Member>> => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.page_size) query.append('page_size', params.page_size.toString());
    if (params.search) query.append('search', params.search);
    if (params.min_risk !== undefined) query.append('min_risk', params.min_risk.toString());

    return apiClient<PaginatedData<Member>>(`/members?${query.toString()}`);
  },

  getMemberDetail: async (memberId: string): Promise<MemberDetail> => {
    return apiClient<MemberDetail>(`/members/${memberId}`);
  },
};
