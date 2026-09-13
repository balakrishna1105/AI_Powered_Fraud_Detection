import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { claimsApi } from '../api/claims';
import type { ClaimCreateInput } from '../api/claims';
import type { Claim, RiskLevel, ClaimStatus, FraudCategory, ClaimType } from '../types';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Pagination } from '../components/ui/Table';
import { RiskBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { formatINR, formatDate, getClaimStatusBadge } from '../utils/formatters';
import {
  Search,
  Filter,
  PlusCircle,
  Eye,
  FileSpreadsheet,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export const Claims: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [claims, setClaims] = useState<Claim[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(Number(searchParams.get('page')) || 1);
  const [pageSize] = useState<number>(15);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters State
  const [search, setSearch] = useState<string>(searchParams.get('search') || '');
  const [riskLevel, setRiskLevel] = useState<string>(searchParams.get('risk_level') || '');
  const [status, setStatus] = useState<string>(searchParams.get('status') || '');
  const [category, setCategory] = useState<string>(searchParams.get('category') || '');
  const [state, setState] = useState<string>(searchParams.get('state') || '');

  // Submit Claim Modal State
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [newClaim, setNewClaim] = useState<ClaimCreateInput>({
    member_id: 'PAT-1001',
    provider_id: 'PRV-2001',
    claim_type: 'INPATIENT',
    claim_amount: 85000,
    hospitalization_days: 3,
    diagnosis_codes: ['I25.1'],
    procedure_codes: ['PROC-ANGIO'],
  });

  const loadClaims = async () => {
    setIsLoading(true);
    try {
      const data = await claimsApi.getClaims({
        page: currentPage,
        page_size: pageSize,
        search: search || undefined,
        risk_level: (riskLevel as RiskLevel) || undefined,
        status: (status as ClaimStatus) || undefined,
        category: (category as FraudCategory) || undefined,
        state: state || undefined,
      });
      setClaims(data.items);
      setTotalItems(data.total);
      setTotalPages(data.total_pages);
    } catch (err) {
      console.error('Failed to load claims', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClaims();
  }, [currentPage, riskLevel, status, category, state]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadClaims();
  };

  const handleResetFilters = () => {
    setSearch('');
    setRiskLevel('');
    setStatus('');
    setCategory('');
    setState('');
    setCurrentPage(1);
    setSearchParams({});
  };

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const created = await claimsApi.submitClaim(newClaim);
      setIsSubmitModalOpen(false);
      navigate(`/claims/${created.id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to submit claim');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <FileSpreadsheet className="h-7 w-7 text-blue-500" />
            Claims Management & Risk Surveillance
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Search, filter, and inspect scored claims across policyholders and network hospitals.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsSubmitModalOpen(true)}
            className="text-xs"
          >
            <PlusCircle className="h-4 w-4 mr-1.5" />
            Submit & Score Claim
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="border-slate-800 bg-slate-900/90 shadow-lg">
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Search Input (2 cols on large) */}
            <div className="lg:col-span-2">
              <Input
                placeholder="Search Claim ID, Member, Provider..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search className="h-4 w-4" />}
              />
            </div>

            {/* Risk Level */}
            <div>
              <Select
                value={riskLevel}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  setRiskLevel(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Risk Levels</option>
                <option value="CRITICAL">Critical Risk (85+)</option>
                <option value="HIGH">High Risk (70-84)</option>
                <option value="MEDIUM">Medium Risk (40-69)</option>
                <option value="LOW">Low Risk (15-39)</option>
                <option value="NORMAL">Normal (&lt;15)</option>
              </Select>
            </div>

            {/* Claim Status */}
            <div>
              <Select
                value={status}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  setStatus(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Statuses</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="PENDING_REVIEW">Pending Review</option>
                <option value="UNDER_INVESTIGATION">Under Investigation</option>
                <option value="CONFIRMED_FRAUD">Confirmed Fraud</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </Select>
            </div>

            {/* State Region */}
            <div>
              <Select
                value={state}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  setState(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All States</option>
                <option value="Telangana">Telangana</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Andhra Pradesh">Andhra Pradesh</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Delhi NCR">Delhi NCR</option>
                <option value="Gujarat">Gujarat</option>
              </Select>
            </div>

            {/* Actions Buttons */}
            <div className="flex items-center gap-2">
              <Button type="submit" variant="secondary" size="md" className="w-full text-xs">
                <Filter className="h-3.5 w-3.5 mr-1" />
                Filter
              </Button>
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleResetFilters}
                title="Reset Filters"
                className="px-2.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Claims Table */}
      <Card className="border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Claim ID</TableHead>
              <TableHead>Member</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Claim Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Diagnosis / Procedure</TableHead>
              <TableHead>Risk Score</TableHead>
              <TableHead>Risk Level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-12 text-slate-400">
                  Loading claims surveillance records...
                </TableCell>
              </TableRow>
            ) : claims.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-12 text-slate-400">
                  No claims found matching your filter criteria.
                </TableCell>
              </TableRow>
            ) : (
              claims.map((c) => {
                const statusBadge = getClaimStatusBadge(c.claim_status);
                return (
                  <TableRow key={c.id}>
                    {/* Claim ID */}
                    <TableCell className="font-mono font-bold text-blue-400 whitespace-nowrap">
                      {c.id}
                    </TableCell>

                    {/* Member */}
                    <TableCell>
                      <div className="font-medium text-slate-200">{c.member_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{c.member_id}</div>
                    </TableCell>

                    {/* Provider */}
                    <TableCell>
                      <div className="font-medium text-slate-200 truncate max-w-[180px]" title={c.provider_name}>
                        {c.provider_name}
                      </div>
                      <div className="text-[11px] text-slate-400">{c.provider_state}</div>
                    </TableCell>

                    {/* Date */}
                    <TableCell className="whitespace-nowrap text-xs text-slate-300">
                      {formatDate(c.claim_date)}
                    </TableCell>

                    {/* Amount */}
                    <TableCell className="font-mono font-bold text-slate-100 whitespace-nowrap">
                      {formatINR(c.claim_amount)}
                    </TableCell>

                    {/* Diagnosis & Procedure */}
                    <TableCell>
                      <div className="text-xs font-mono font-semibold text-slate-300">
                        {c.diagnosis_codes?.[0] || 'N/A'}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                        {c.procedure_codes?.[0] || 'General'}
                      </div>
                    </TableCell>

                    {/* Risk Score */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full ${
                              (c.fraud_score || 0) >= 85 ? 'bg-rose-500' :
                              (c.fraud_score || 0) >= 70 ? 'bg-orange-500' :
                              (c.fraud_score || 0) >= 40 ? 'bg-amber-500' :
                              'bg-emerald-500'
                            }`}
                            style={{ width: `${c.fraud_score || 10}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-xs text-slate-200">
                          {c.fraud_score?.toFixed(0) || '0'}
                        </span>
                      </div>
                    </TableCell>

                    {/* Risk Level */}
                    <TableCell>
                      <RiskBadge level={c.risk_level} size="sm" />
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusBadge.className}`}>
                        {statusBadge.label}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right whitespace-nowrap">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/claims/${c.id}`)}
                        className="text-xs h-8"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Inspect
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={(p) => setCurrentPage(p)}
        />
      </Card>

      {/* Submit & Score Claim Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Submit New Claim to Fraud Detection Engine"
        description="Simulate an inbound health claim to test real-time ML feature extraction and risk scoring."
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateClaim} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">Member ID</label>
              <Input
                required
                value={newClaim.member_id}
                onChange={(e) => setNewClaim({ ...newClaim, member_id: e.target.value })}
                placeholder="PAT-1001"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">Provider ID</label>
              <Input
                required
                value={newClaim.provider_id}
                onChange={(e) => setNewClaim({ ...newClaim, provider_id: e.target.value })}
                placeholder="PRV-2001"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">Claim Amount (INR ₹)</label>
              <Input
                type="number"
                required
                value={newClaim.claim_amount}
                onChange={(e) => setNewClaim({ ...newClaim, claim_amount: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">Hospitalization Days</label>
              <Input
                type="number"
                required
                value={newClaim.hospitalization_days}
                onChange={(e) => setNewClaim({ ...newClaim, hospitalization_days: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">Claim Type</label>
              <Select
                value={newClaim.claim_type}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewClaim({ ...newClaim, claim_type: e.target.value as ClaimType })}
              >
                <option value="INPATIENT">Inpatient</option>
                <option value="OUTPATIENT">Outpatient</option>
                <option value="DAYCARE">Daycare</option>
                <option value="EMERGENCY">Emergency</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">Primary ICD-10 Diagnosis</label>
              <Select
                value={newClaim.diagnosis_codes[0] || 'I25.1'}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewClaim({ ...newClaim, diagnosis_codes: [e.target.value] })}
              >
                <option value="I25.1">I25.1 - Atherosclerotic heart disease</option>
                <option value="E11.9">E11.9 - Type 2 diabetes mellitus</option>
                <option value="K35.8">K35.8 - Acute appendicitis</option>
                <option value="M54.5">M54.5 - Low back pain</option>
                <option value="J18.9">J18.9 - Pneumonia unspecified</option>
                <option value="J00">J00 - Acute nasopharyngitis (Cold / Flu)</option>
                <option value="N20.0">N20.0 - Calculus of kidney</option>
              </Select>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">Billed Procedure</label>
              <Select
                value={newClaim.procedure_codes[0] || 'PROC-ANGIO'}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewClaim({ ...newClaim, procedure_codes: [e.target.value] })}
              >
                <option value="PROC-ANGIO">PROC-ANGIO - Coronary Angiography</option>
                <option value="PROC-CABG">PROC-CABG - Coronary Artery Bypass (High Cost)</option>
                <option value="PROC-APPEN">PROC-APPEN - Appendectomy</option>
                <option value="PROC-TKR">PROC-TKR - Total Knee Replacement</option>
                <option value="PROC-ICU-VENT">PROC-ICU-VENT - ICU Ventilator Care</option>
                <option value="PROC-DIALYSIS">PROC-DIALYSIS - Hemodialysis</option>
                <option value="PROC-OPD-CONSULT">PROC-OPD-CONSULT - Outpatient Consultation</option>
              </Select>
            </div>
          </div>

          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-300 flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Upon submission, the claim will instantly flow through duplicate validation, diagnosis-procedure compatibility matrix, feature engineering, and the ML fraud scoring engine.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsSubmitModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Run Fraud Scoring Pipeline
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
