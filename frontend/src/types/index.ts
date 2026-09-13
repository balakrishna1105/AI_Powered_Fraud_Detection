export type UserRole = 'ADMIN' | 'INVESTIGATOR' | 'ANALYST';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export type ClaimStatus =
  | 'SUBMITTED'
  | 'PENDING_REVIEW'
  | 'UNDER_INVESTIGATION'
  | 'APPROVED'
  | 'REJECTED'
  | 'CONFIRMED_FRAUD';

export type ClaimType = 'INPATIENT' | 'OUTPATIENT' | 'DAYCARE' | 'EMERGENCY';

export type RiskLevel = 'NORMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type FraudCategory =
  | 'BILLING_FRAUD'
  | 'PROVIDER_FRAUD'
  | 'MEMBER_FRAUD'
  | 'IDENTITY_FRAUD'
  | 'PRESCRIPTION_FRAUD'
  | 'DUPLICATE_CLAIM'
  | 'UPCODING'
  | 'PHANTOM_SERVICES'
  | 'UNNECESSARY_HOSPITALIZATION'
  | 'NONE';

export type InvestigationStatus =
  | 'NEW'
  | 'ASSIGNED'
  | 'UNDER_REVIEW'
  | 'INFORMATION_REQUIRED'
  | 'ESCALATED'
  | 'CONFIRMED_FRAUD'
  | 'FALSE_POSITIVE'
  | 'CLOSED';

export type RuleSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ReportStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type ReportType =
  | 'FRAUD_SUMMARY'
  | 'PROVIDER_FRAUD'
  | 'MEMBER_FRAUD'
  | 'INVESTIGATOR_PERFORMANCE'
  | 'FRAUD_TRENDS'
  | 'INVESTIGATION_REPORT';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  department: string;
  status: UserStatus;
  last_login?: string;
  created_at: string;
  updated_at?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface FraudExplanation {
  feature: string;
  impact: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  weight?: number;
  value?: any;
}

export interface FraudIndicator {
  id: string;
  category: string;
  feature: string;
  impact: string;
  description: string;
  created_at: string;
}

export interface FraudScore {
  id: string;
  claim_id: string;
  risk_score: number;
  fraud_probability: number;
  risk_level: RiskLevel;
  model_version: string;
  scored_at: string;
  explanations: FraudExplanation[];
}

export interface Claim {
  id: string;
  member_id: string;
  provider_id: string;
  claim_type: ClaimType;
  claim_amount: number;
  approved_amount?: number | null;
  admission_date?: string | null;
  discharge_date?: string | null;
  hospitalization_days: number;
  claim_date: string;
  claim_status: ClaimStatus;
  diagnosis_codes: string[];
  procedure_codes: string[];
  fraud_category: FraudCategory;
  created_at: string;
  member_name?: string;
  provider_name?: string;
  provider_state?: string;
  fraud_score?: number;
  risk_level?: RiskLevel;
  assigned_investigator?: string | null;
  investigation_id?: string | null;
}

export interface MemberSummary {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  gender: string;
  policy_number: string;
  policy_tier: string;
  policy_start_date: string;
  risk_score: number;
}

export interface ProviderSummary {
  id: string;
  name: string;
  provider_type: string;
  state: string;
  city: string;
  risk_score: number;
  historical_claims_count: number;
  historical_fraud_rate: number;
  avg_claim_amount: number;
}

export interface ClaimDetail {
  claim: Claim;
  member: MemberSummary;
  provider: ProviderSummary;
  fraud_score?: FraudScore;
  indicators: FraudIndicator[];
  active_investigation_id?: string | null;
  active_investigation_status?: string | null;
  related_claims: Claim[];
}

export interface FraudRule {
  id: string;
  name: string;
  description: string;
  category: FraudCategory;
  severity: RuleSeverity;
  threshold: number;
  is_active: boolean;
  rule_type: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  version: string;
}

export interface InvestigationNote {
  id: string;
  investigation_id: string;
  author_id: string;
  author_name?: string;
  note_text: string;
  created_at: string;
}

export interface InvestigationEvidence {
  id: string;
  investigation_id: string;
  title: string;
  file_type: string;
  file_url: string;
  description?: string;
  uploaded_by: string;
  uploaded_at: string;
}

export interface Investigation {
  id: string;
  claim_id: string;
  investigator_id?: string | null;
  investigator_name?: string | null;
  status: InvestigationStatus;
  priority: RiskLevel;
  findings?: string | null;
  final_decision?: string | null;
  decision_rationale?: string | null;
  opened_at: string;
  closed_at?: string | null;
  created_at: string;
  updated_at: string;
  claim_amount?: number;
  member_id?: string;
  member_name?: string;
  provider_id?: string;
  provider_name?: string;
  fraud_score?: number;
  risk_level?: RiskLevel;
}

export interface InvestigationDetail {
  investigation: Investigation;
  claim_details: ClaimDetail;
  notes: InvestigationNote[];
  evidence: InvestigationEvidence[];
  audit_history: any[];
}

export interface Provider {
  id: string;
  name: string;
  provider_type: string;
  state: string;
  city: string;
  address?: string;
  risk_score: number;
  historical_claims_count: number;
  historical_fraud_count: number;
  historical_fraud_rate: number;
  avg_claim_amount: number;
  total_claim_value: number;
  suspicious_claims_count: number;
  created_at: string;
}

export interface ProviderDetail {
  provider: Provider;
  peer_avg_claim_amount: number;
  peer_avg_fraud_rate: number;
  peer_avg_risk_score: number;
  common_procedures: { procedure: string; name: string; count: number; avg_cost: number }[];
  fraud_trend: { month: string; claims: number; fraud_count: number }[];
  risk_indicators: string[];
  claims: Claim[];
  investigations: any[];
}

export interface Member {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  gender: string;
  state: string;
  city: string;
  policy_number: string;
  policy_tier: string;
  policy_start_date: string;
  policy_expiry_date?: string;
  risk_score: number;
  claims_count: number;
  total_claim_value: number;
  suspicious_claims_count: number;
  created_at: string;
}

export interface MemberDetail {
  member: Member;
  hospitalization_history: { admission: string; days: number; hospital: string; amount: number }[];
  provider_relationships: { provider: string; claims_count: number; last_visit: string }[];
  suspicious_patterns: string[];
  risk_timeline: { date: string; risk_score: number }[];
  claims: Claim[];
}

export interface DashboardSummary {
  total_claims: number;
  claims_analyzed: number;
  suspicious_claims: number;
  confirmed_fraud: number;
  potential_fraud_amount: number;
  fraud_prevented: number;
  detection_rate: number;
  false_positive_rate: number;
  total_claims_growth: number;
  claims_analyzed_growth: number;
  suspicious_claims_growth: number;
  confirmed_fraud_growth: number;
  potential_fraud_amount_growth: number;
  fraud_prevented_growth: number;
  detection_rate_change: number;
  false_positive_rate_change: number;
}

export interface FraudTrend {
  date: string;
  total_claims: number;
  suspicious_claims: number;
  confirmed_fraud: number;
  fraud_amount: number;
  prevented_amount: number;
}

export interface FraudByCategory {
  category: string;
  label: string;
  count: number;
  amount: number;
  percentage: number;
}

export interface FraudByRegion {
  state: string;
  total_claims: number;
  suspicious_claims: number;
  confirmed_fraud: number;
  total_amount: number;
  fraud_amount: number;
  fraud_rate: number;
  risk_level: string;
}

export interface TopProvider {
  id: string;
  name: string;
  state: string;
  city: string;
  suspicious_claims: number;
  total_claims: number;
  fraud_amount: number;
  fraud_percentage: number;
  risk_score: number;
}

export interface HighPriorityAlert {
  claim_id: string;
  member_id: string;
  member_name: string;
  provider_id: string;
  provider_name: string;
  claim_amount: number;
  fraud_score: number;
  risk_level: RiskLevel;
  fraud_indicators: string[];
  claim_date: string;
  assigned_investigator?: string | null;
  investigation_status?: string | null;
  investigation_id?: string | null;
}

export interface ReportJob {
  id: string;
  title: string;
  report_type: ReportType;
  status: ReportStatus;
  filters: Record<string, any>;
  file_format: string;
  file_path?: string;
  row_count: number;
  created_by: string;
  created_at: string;
  completed_at?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user_email: string;
  user_id?: string;
  action: string;
  resource: string;
  resource_id?: string;
  previous_value?: any;
  new_value?: any;
  ip_address: string;
  session_info?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  recipient_id?: string;
  recipient_role?: string;
  is_read: boolean;
  reference_id?: string;
  reference_type?: string;
  created_at: string;
}

export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  description?: string;
  updated_by: string;
  updated_at: string;
}

export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string | null;
  error?: any;
  timestamp: string;
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
