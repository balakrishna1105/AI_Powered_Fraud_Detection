import { apiClient } from './client';
import type { Claim, ClaimDetail, PaginatedData, RiskLevel, ClaimStatus, FraudCategory } from '../types';

export interface ClaimFilterParams {
  page?: number;
  page_size?: number;
  search?: string;
  risk_level?: RiskLevel;
  status?: ClaimStatus;
  provider_id?: string;
  member_id?: string;
  category?: FraudCategory;
  min_amount?: number;
  max_amount?: number;
  state?: string;
}

export interface ClaimCreateInput {
  member_id: string;
  provider_id: string;
  claim_type: string;
  claim_amount: number;
  admission_date?: string;
  discharge_date?: string;
  hospitalization_days: number;
  diagnosis_codes: string[];
  procedure_codes: string[];
}

export const claimsApi = {
  getClaims: async (params: ClaimFilterParams = {}): Promise<PaginatedData<Claim>> => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.page_size) query.append('page_size', params.page_size.toString());
    if (params.search) query.append('search', params.search);
    if (params.risk_level) query.append('risk_level', params.risk_level);
    if (params.status) query.append('status', params.status);
    if (params.provider_id) query.append('provider_id', params.provider_id);
    if (params.member_id) query.append('member_id', params.member_id);
    if (params.category && params.category !== 'NONE') query.append('category', params.category);
    if (params.min_amount !== undefined) query.append('min_amount', params.min_amount.toString());
    if (params.max_amount !== undefined) query.append('max_amount', params.max_amount.toString());
    if (params.state) query.append('state', params.state);

    return apiClient<PaginatedData<Claim>>(`/claims?${query.toString()}`);
  },

  getClaimDetail: async (claimId: string): Promise<ClaimDetail> => {
    return apiClient<ClaimDetail>(`/claims/${claimId}`);
  },

  submitClaim: async (data: ClaimCreateInput): Promise<Claim> => {
    return apiClient<Claim>('/claims', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
