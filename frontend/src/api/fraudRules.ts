import { apiClient } from './client';
import type { FraudRule, FraudCategory, RuleSeverity } from '../types';

export interface FraudRuleCreateInput {
  name: string;
  description: string;
  category: FraudCategory;
  severity: RuleSeverity;
  threshold: number;
  rule_type?: string;
  is_active?: boolean;
}

export interface FraudRuleUpdateInput {
  name?: string;
  description?: string;
  category?: FraudCategory;
  severity?: RuleSeverity;
  threshold?: number;
  is_active?: boolean;
}

export const fraudRulesApi = {
  getAllRules: async (): Promise<FraudRule[]> => {
    return apiClient<FraudRule[]>('/fraud-rules');
  },

  createRule: async (data: FraudRuleCreateInput): Promise<FraudRule> => {
    return apiClient<FraudRule>('/fraud-rules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateRule: async (ruleId: string, data: FraudRuleUpdateInput): Promise<FraudRule> => {
    return apiClient<FraudRule>(`/fraud-rules/${ruleId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  toggleRule: async (ruleId: string, is_active: boolean): Promise<FraudRule> => {
    return apiClient<FraudRule>(`/fraud-rules/${ruleId}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active }),
    });
  },

  deleteRule: async (ruleId: string): Promise<{ deleted: boolean }> => {
    return apiClient<{ deleted: boolean }>(`/fraud-rules/${ruleId}`, {
      method: 'DELETE',
    });
  },
};
