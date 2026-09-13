import { apiClient } from './client';
import type { FraudExplanation } from '../types';

export interface ClaimScoreInput {
  claim_id: string;
  patient_id: string;
  provider_id: string;
  claim_amount: number;
  diagnosis_codes: string[];
  procedure_codes: string[];
  hospitalization_days: number;
  admission_date?: string;
  discharge_date?: string;
}

export interface ClaimScoreResult {
  claim_id: string;
  fraud_probability: number;
  risk_score: number;
  risk_level: string;
  fraud_indicators: string[];
  explanations: FraudExplanation[];
}

export const fraudApi = {
  scoreClaim: async (data: ClaimScoreInput): Promise<ClaimScoreResult> => {
    return apiClient<ClaimScoreResult>('/fraud/score', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getRulesSummary: async (): Promise<any> => {
    return apiClient<any>('/fraud/rules-summary');
  },
};
