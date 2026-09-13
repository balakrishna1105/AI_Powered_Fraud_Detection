import { apiClient } from './client';
import type {
  Investigation,
  InvestigationDetail,
  InvestigationNote,
  InvestigationEvidence,
  PaginatedData,
  InvestigationStatus,
  RiskLevel,
} from '../types';

export interface InvestigationFilterParams {
  page?: number;
  page_size?: number;
  status?: InvestigationStatus;
  priority?: RiskLevel;
  investigator_id?: string;
  search?: string;
}

export const investigationsApi = {
  getInvestigations: async (
    params: InvestigationFilterParams = {}
  ): Promise<PaginatedData<Investigation>> => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.page_size) query.append('page_size', params.page_size.toString());
    if (params.status) query.append('status', params.status);
    if (params.priority) query.append('priority', params.priority);
    if (params.investigator_id) query.append('investigator_id', params.investigator_id);
    if (params.search) query.append('search', params.search);

    return apiClient<PaginatedData<Investigation>>(`/investigations?${query.toString()}`);
  },

  getInvestigationDetail: async (investigationId: string): Promise<InvestigationDetail> => {
    return apiClient<InvestigationDetail>(`/investigations/${investigationId}`);
  },

  createInvestigation: async (data: {
    claim_id: string;
    investigator_id?: string;
    priority?: RiskLevel;
    findings?: string;
  }): Promise<Investigation> => {
    return apiClient<Investigation>('/investigations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateStatus: async (
    investigationId: string,
    status: InvestigationStatus,
    notes?: string
  ): Promise<{ status: string }> => {
    return apiClient<{ status: string }>(`/investigations/${investigationId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  },

  assignInvestigator: async (
    investigationId: string,
    investigatorId: string
  ): Promise<{ investigator_id: string }> => {
    return apiClient<{ investigator_id: string }>(`/investigations/${investigationId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ investigator_id: investigatorId }),
    });
  },

  submitDecision: async (
    investigationId: string,
    final_decision: string,
    decision_rationale: string,
    status: InvestigationStatus = 'CLOSED'
  ): Promise<{ decision: string; status: string }> => {
    return apiClient<{ decision: string; status: string }>(
      `/investigations/${investigationId}/decision`,
      {
        method: 'POST',
        body: JSON.stringify({ final_decision, decision_rationale, status }),
      }
    );
  },

  addNote: async (investigationId: string, note_text: string): Promise<InvestigationNote> => {
    return apiClient<InvestigationNote>(`/investigations/${investigationId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note_text }),
    });
  },

  addEvidence: async (
    investigationId: string,
    data: { title: string; file_type?: string; file_url: string; description?: string }
  ): Promise<InvestigationEvidence> => {
    return apiClient<InvestigationEvidence>(`/investigations/${investigationId}/evidence`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
