import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { claimsApi } from '../api/claims';
import { investigationsApi } from '../api/investigations';
import type { ClaimDetail as ClaimDetailType } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { RiskBadge } from '../components/ui/Badge';
import { RiskGauge } from '../components/ui/RiskGauge';
import { Modal } from '../components/ui/Modal';
import {
  formatINR,
  formatDate,
  getClaimStatusBadge,
  getFraudCategoryLabel,
} from '../utils/formatters';
import {
  ArrowLeft,
  ShieldAlert,
  Building2,
  User as UserIcon,
  Activity,
  IndianRupee,
  SearchCode,
  Clock,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

export const ClaimDetail: React.FC = () => {
  const { claimId } = useParams<{ claimId: string }>();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<ClaimDetailType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOpeningInv, setIsOpeningInv] = useState<boolean>(false);
  const [isInvModalOpen, setIsInvModalOpen] = useState<boolean>(false);
  const [invFindings, setInvFindings] = useState<string>('');

  const loadClaimDetail = async () => {
    if (!claimId) return;
    setIsLoading(true);
    try {
      const data = await claimsApi.getClaimDetail(claimId);
      setDetail(data);
    } catch (err) {
      console.error('Failed to load claim detail', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClaimDetail();
  }, [claimId]);

  const handleInitiateInvestigation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimId) return;
    setIsOpeningInv(true);
    try {
      const inv = await investigationsApi.createInvestigation({
        claim_id: claimId,
        priority: detail?.fraud_score?.risk_level || 'HIGH',
        findings: invFindings || 'Investigation opened from claim surveillance workbench.',
      });
      setIsInvModalOpen(false);
      navigate(`/investigations/${inv.id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to open investigation');
    } finally {
      setIsOpeningInv(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-slate-400 max-w-7xl mx-auto">
        Loading complete claim assessment and explainability metrics...
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="py-20 text-center text-slate-400 max-w-7xl mx-auto space-y-4">
        <p>Claim '{claimId}' not found.</p>
        <Button variant="secondary" onClick={() => navigate('/claims')}>
          Back to Claims
        </Button>
      </div>
    );
  }

  const { claim, member, provider, fraud_score, indicators, active_investigation_id, related_claims } = detail;
  const statusBadge = getClaimStatusBadge(claim.claim_status);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/claims')}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-mono text-white">{claim.id}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusBadge.className}`}>
                {statusBadge.label}
              </span>
              <RiskBadge level={fraud_score?.risk_level} size="sm" />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Claim submitted on {formatDate(claim.claim_date)} · Category: {getFraudCategoryLabel(claim.fraud_category)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {active_investigation_id ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/investigations/${active_investigation_id}`)}
              className="text-xs"
            >
              <SearchCode className="h-4 w-4" />
              Open SIU Workbench ({active_investigation_id})
            </Button>
          ) : (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsInvModalOpen(true)}
              className="text-xs"
            >
              <ShieldAlert className="h-4 w-4" />
              Initiate Fraud Investigation
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid: 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Claim, Member, Provider, Medical Info (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Claim Summary */}
          <Card className="border-slate-800 bg-slate-900/90 shadow-xl">
            <CardHeader className="pb-3 border-b border-slate-800">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-blue-400" />
                Claim Financial Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400">Claim Amount</span>
                <p className="text-lg font-bold font-mono text-white mt-0.5">
                  {formatINR(claim.claim_amount)}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Approved Amount</span>
                <p className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                  {claim.approved_amount != null ? formatINR(claim.approved_amount) : 'Pending Review'}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Claim Type</span>
                <p className="font-semibold text-slate-200 mt-0.5">{claim.claim_type}</p>
              </div>
              <div>
                <span className="text-slate-400">Claim Date</span>
                <p className="font-semibold text-slate-200 mt-0.5">{formatDate(claim.claim_date)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Member & Provider Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Member Profile */}
            <Card className="border-slate-800 bg-slate-900/90 shadow-xl">
              <CardHeader className="pb-3 border-b border-slate-800 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-blue-400" />
                  Member Information
                </CardTitle>
                <Link to={`/members/${member.id}`} className="text-[11px] text-blue-400 hover:underline flex items-center gap-0.5">
                  Profile <ExternalLink className="h-3 w-3" />
                </Link>
              </CardHeader>
              <CardContent className="p-4 space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Member ID:</span>
                  <span className="font-mono font-semibold text-slate-200">{member.id}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Name:</span>
                  <span className="font-semibold text-slate-200">{member.first_name} {member.last_name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Age / Gender:</span>
                  <span className="font-semibold text-slate-200">{member.age} yrs · {member.gender}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Policy Plan:</span>
                  <span className="font-semibold text-slate-200 truncate max-w-[160px]">{member.policy_tier}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Policy Start Date:</span>
                  <span className="font-semibold text-slate-200">{formatDate(member.policy_start_date)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Provider Profile */}
            <Card className="border-slate-800 bg-slate-900/90 shadow-xl">
              <CardHeader className="pb-3 border-b border-slate-800 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-purple-400" />
                  Provider Profile
                </CardTitle>
                <Link to={`/providers/${provider.id}`} className="text-[11px] text-purple-400 hover:underline flex items-center gap-0.5">
                  Hospital <ExternalLink className="h-3 w-3" />
                </Link>
              </CardHeader>
              <CardContent className="p-4 space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Provider ID:</span>
                  <span className="font-mono font-semibold text-slate-200">{provider.id}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Hospital Name:</span>
                  <span className="font-semibold text-slate-200 truncate max-w-[170px]" title={provider.name}>{provider.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Location:</span>
                  <span className="font-semibold text-slate-200">{provider.city}, {provider.state}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Historical Fraud Rate:</span>
                  <span className={`font-bold ${provider.historical_fraud_rate > 10 ? 'text-rose-400' : 'text-slate-200'}`}>
                    {provider.historical_fraud_rate}%
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Provider Risk Score:</span>
                  <span className="font-mono font-bold text-amber-400">{provider.risk_score}/100</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Section 3: Medical Information */}
          <Card className="border-slate-800 bg-slate-900/90 shadow-xl">
            <CardHeader className="pb-3 border-b border-slate-800">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-400" />
                Clinical & Hospitalization Record
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400">ICD-10 Diagnoses</span>
                <div className="mt-1 space-y-1">
                  {claim.diagnosis_codes?.map((dx, i) => (
                    <div key={i} className="inline-block px-2 py-0.5 rounded-md bg-slate-800 font-mono text-blue-300 font-bold border border-slate-700 mr-1">
                      {dx}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-slate-400">Billed Procedures</span>
                <div className="mt-1 space-y-1">
                  {claim.procedure_codes?.map((pr, i) => (
                    <div key={i} className="inline-block px-2 py-0.5 rounded-md bg-slate-800 font-mono text-purple-300 font-bold border border-slate-700 mr-1">
                      {pr}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-slate-400">Admission / Discharge</span>
                <p className="font-semibold text-slate-200 mt-1">
                  {formatDate(claim.admission_date)} → {formatDate(claim.discharge_date)}
                </p>
              </div>

              <div>
                <span className="text-slate-400">Length of Stay</span>
                <p className="text-base font-bold font-mono text-slate-100 mt-0.5">
                  {claim.hospitalization_days} Days
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Related Historical Claims for this Patient */}
          {related_claims && related_claims.length > 0 && (
            <Card className="border-slate-800 bg-slate-900/90 shadow-xl">
              <CardHeader className="pb-3 border-b border-slate-800">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  Prior Member Claims History (Last 5 Records)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-slate-800/60">
                {related_claims.map((rc) => (
                  <div
                    key={rc.id}
                    onClick={() => navigate(`/claims/${rc.id}`)}
                    className="p-3.5 hover:bg-slate-800/40 transition-colors flex items-center justify-between text-xs cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-400">{rc.id}</span>
                        <RiskBadge level={rc.risk_level} size="sm" />
                        <span className="text-slate-400">· {formatDate(rc.claim_date)}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5">{rc.provider_name}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-200">{formatINR(rc.claim_amount)}</span>
                      <p className="text-[11px] text-slate-400">{rc.claim_status}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Fraud Risk Assessment & Explainable AI (1 Col) */}
        <div className="space-y-6">
          {/* Circular Gauge Card */}
          <Card className="border-slate-800 bg-slate-900/90 shadow-2xl">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-base flex items-center justify-center gap-2">
                <ShieldAlert className="h-5 w-5 text-rose-500" />
                Fraud Risk Assessment
              </CardTitle>
              <p className="text-xs text-slate-400">Hybrid Ensemble ML + Clinical Rules Model</p>
            </CardHeader>
            <CardContent className="pt-2 pb-6 flex flex-col items-center">
              <RiskGauge
                score={fraud_score?.risk_score || 0}
                riskLevel={fraud_score?.risk_level}
                size={200}
              />

              <div className="w-full mt-6 grid grid-cols-2 gap-3 text-center border-t border-slate-800 pt-4 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400">Fraud Probability</span>
                  <p className="text-base font-extrabold font-mono text-white mt-0.5">
                    {((fraud_score?.fraud_probability || 0) * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400">Model Version</span>
                  <p className="text-xs font-bold text-slate-200 mt-1 truncate">
                    {fraud_score?.model_version || 'v2.4'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Explainable AI Factors */}
          <Card className="border-slate-800 bg-slate-900/90 shadow-2xl">
            <CardHeader className="pb-3 border-b border-slate-800">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-400" />
                Explainable AI Indicators
              </CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">Key clinical & statistical drivers behind the risk score</p>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              {fraud_score?.explanations && fraud_score.explanations.length > 0 ? (
                fraud_score.explanations.map((exp, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/90 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                        <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                        {exp.feature.replace(/_/g, ' ')}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        exp.impact === 'CRITICAL' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                        exp.impact === 'HIGH' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30' :
                        'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}>
                        {exp.impact} IMPACT
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">{exp.description}</p>
                  </div>
                ))
              ) : (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                  No critical fraud anomaly indicators detected. Claim parameters fall within normal clinical baselines.
                </div>
              )}

              {/* Triggered Indicators Feed */}
              {indicators && indicators.length > 0 && (
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Triggered Rule Flags
                  </span>
                  <div className="space-y-1.5">
                    {indicators.map((ind) => (
                      <div
                        key={ind.id}
                        className="px-2.5 py-1.5 rounded-md bg-rose-950/30 border border-rose-800/40 text-rose-300 text-[11px] flex items-start gap-1.5"
                      >
                        <AlertTriangle className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
                        <span>{ind.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Initiate Investigation Dialog */}
      <Modal
        isOpen={isInvModalOpen}
        onClose={() => setIsInvModalOpen(false)}
        title="Open Special Investigation Unit (SIU) Case"
        description={`Initiate a formal investigation workbench case for claim ${claim.id}.`}
      >
        <form onSubmit={handleInitiateInvestigation} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Claim Amount:</span>
              <span className="font-bold font-mono text-white">{formatINR(claim.claim_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Calculated Risk Score:</span>
              <span className="font-bold font-mono text-rose-400">{fraud_score?.risk_score}/100</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Preliminary Audit Findings & Scope
            </label>
            <textarea
              required
              rows={4}
              value={invFindings}
              onChange={(e) => setInvFindings(e.target.value)}
              placeholder="Enter initial investigation reasoning, requested documents, and hospital inquiries..."
              className="w-full rounded-lg border border-slate-750 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsInvModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" size="sm" isLoading={isOpeningInv}>
              Open Case in SIU Queue
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
