import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { investigationsApi } from '../api/investigations';
import { usersApi } from '../api/users';
import type {
  InvestigationDetail as InvestigationDetailType,
  User,
} from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { RiskBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Tabs } from '../components/ui/Tabs';
import {
  formatINR,
  formatDate,
  formatDateTime,
  getInvestigationStatusBadge,
} from '../utils/formatters';
import {
  ArrowLeft,
  Building2,
  User as UserIcon,
  FileCheck2,
  FileText,
  Upload,
  UserCheck,
  ShieldAlert,
  History,
  ExternalLink,
} from 'lucide-react';

export const InvestigationDetail: React.FC = () => {
  const { investigationId } = useParams<{ investigationId: string }>();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<InvestigationDetailType | null>(null);
  const [investigators, setInvestigators] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('notes');

  // Modals state
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState<boolean>(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState<boolean>(false);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState<boolean>(false);

  // Form states
  const [newNoteText, setNewNoteText] = useState<string>('');
  const [decisionType, setDecisionType] = useState<string>('CONFIRMED_FRAUD');
  const [decisionRationale, setDecisionRationale] = useState<string>('');
  const [selectedInvestigatorId, setSelectedInvestigatorId] = useState<string>('');
  const [evidenceTitle, setEvidenceTitle] = useState<string>('');
  const [evidenceType, setEvidenceType] = useState<string>('PDF');
  const [evidenceDesc, setEvidenceDesc] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadData = async () => {
    if (!investigationId) return;
    setIsLoading(true);
    try {
      const invData = await investigationsApi.getInvestigationDetail(investigationId);
      setDetail(invData);
      setSelectedInvestigatorId(invData.investigation.investigator_id || '');

      // Load investigators list for assignment modal
      const uData = await usersApi.getUsers({ role: 'INVESTIGATOR' });
      setInvestigators(uData.items);
    } catch (err) {
      console.error('Failed to load investigation', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [investigationId]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!investigationId || !newNoteText.trim()) return;
    setIsSubmitting(true);
    try {
      await investigationsApi.addNote(investigationId, newNoteText);
      setNewNoteText('');
      setIsNoteModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to add note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!investigationId || !evidenceTitle.trim()) return;
    setIsSubmitting(true);
    try {
      await investigationsApi.addEvidence(investigationId, {
        title: evidenceTitle,
        file_type: evidenceType,
        file_url: `/evidence/${evidenceTitle.toLowerCase().replace(/\s+/g, '_')}.${evidenceType.toLowerCase()}`,
        description: evidenceDesc,
      });
      setEvidenceTitle('');
      setEvidenceDesc('');
      setIsEvidenceModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to add evidence');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!investigationId || !selectedInvestigatorId) return;
    setIsSubmitting(true);
    try {
      await investigationsApi.assignInvestigator(investigationId, selectedInvestigatorId);
      setIsAssignModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to assign investigator');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!investigationId || !decisionRationale.trim()) return;
    setIsSubmitting(true);
    try {
      await investigationsApi.submitDecision(
        investigationId,
        decisionType,
        decisionRationale,
        decisionType === 'CONFIRMED_FRAUD'
          ? 'CONFIRMED_FRAUD'
          : decisionType === 'FALSE_POSITIVE'
          ? 'FALSE_POSITIVE'
          : decisionType === 'ESCALATED'
          ? 'ESCALATED'
          : 'CLOSED'
      );
      setIsDecisionModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit decision');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-slate-400 max-w-7xl mx-auto">
        Loading SIU Investigation Workbench...
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="py-20 text-center text-slate-400 max-w-7xl mx-auto space-y-4">
        <p>Investigation '{investigationId}' not found.</p>
        <Button variant="secondary" onClick={() => navigate('/investigations')}>
          Back to Investigations
        </Button>
      </div>
    );
  }

  const { investigation: inv, claim_details, notes, evidence, audit_history } = detail;
  const statusBadge = getInvestigationStatusBadge(inv.status);

  const workbenchTabs = [
    { id: 'notes', label: 'Investigation Notes & Timeline', count: notes.length },
    { id: 'evidence', label: 'Supporting Evidence', count: evidence.length },
    { id: 'cross_audit', label: 'Member & Provider History' },
    { id: 'audit_logs', label: 'Immutable Audit Trail', count: audit_history.length },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header & Workflow Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/investigations')}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-bold font-mono text-amber-400">{inv.id}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusBadge.className}`}>
                {statusBadge.label}
              </span>
              <RiskBadge level={inv.priority} size="sm" />
              <span className="text-xs text-slate-400">· Opened {formatDate(inv.opened_at)}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <span>Target Claim:</span>
              <Link to={`/claims/${inv.claim_id}`} className="font-mono font-bold text-blue-400 hover:underline flex items-center gap-1">
                {inv.claim_id} <ExternalLink className="h-3 w-3" />
              </Link>
              <span>· Investigator:</span>
              <span className="text-slate-200 font-semibold">{inv.investigator_name || 'Unassigned'}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsAssignModalOpen(true)}
            className="text-xs"
          >
            <UserCheck className="h-3.5 w-3.5 mr-1" />
            {inv.investigator_id ? 'Reassign' : 'Assign Investigator'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsNoteModalOpen(true)}
            className="text-xs"
          >
            <FileText className="h-3.5 w-3.5 mr-1" />
            Add Note
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEvidenceModalOpen(true)}
            className="text-xs"
          >
            <Upload className="h-3.5 w-3.5 mr-1" />
            Attach Evidence
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsDecisionModalOpen(true)}
            className="text-xs font-semibold"
          >
            <ShieldAlert className="h-3.5 w-3.5 mr-1" />
            Enforce Decision
          </Button>
        </div>
      </div>

      {/* Claim Synopsis Banner */}
      <Card className="border-slate-800 bg-slate-900/90 shadow-lg">
        <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs">
          <div>
            <span className="text-slate-400">Claim Amount</span>
            <p className="text-base font-bold font-mono text-white mt-0.5">
              {formatINR(inv.claim_amount || 0)}
            </p>
          </div>
          <div>
            <span className="text-slate-400">Member Patient</span>
            <p className="font-semibold text-slate-200 mt-0.5 truncate">{inv.member_name} ({inv.member_id})</p>
          </div>
          <div>
            <span className="text-slate-400">Provider Hospital</span>
            <p className="font-semibold text-slate-200 mt-0.5 truncate" title={inv.provider_name}>{inv.provider_name}</p>
          </div>
          <div>
            <span className="text-slate-400">Calculated Risk Score</span>
            <p className="text-base font-extrabold font-mono text-rose-400 mt-0.5">
              {inv.fraud_score}/100
            </p>
          </div>
          <div>
            <span className="text-slate-400">Final Decision</span>
            <p className="font-bold text-amber-400 mt-0.5">{inv.final_decision || 'Pending Review'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs Workspace */}
      <div className="space-y-4">
        <Tabs tabs={workbenchTabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* Tab 1: Notes & Timeline */}
        {activeTab === 'notes' && (
          <Card className="border-slate-800 bg-slate-900/90 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-800">
              <CardTitle className="text-sm">Investigation Activity & Clinical Notes</CardTitle>
              <Button variant="primary" size="sm" onClick={() => setIsNoteModalOpen(true)} className="text-xs">
                <FileText className="h-3.5 w-3.5 mr-1" />
                Add Case Note
              </Button>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {/* Findings Overview */}
              {inv.findings && (
                <div className="p-3.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs">
                  <span className="font-bold text-blue-300 block mb-1">Initial Case Findings & Scope:</span>
                  <p className="text-slate-200 leading-relaxed">{inv.findings}</p>
                </div>
              )}

              {/* Notes Stream */}
              <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
                {notes.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No notes added yet.</p>
                ) : (
                  notes.map((note) => (
                    <div key={note.id} className="relative flex items-start gap-4 pl-8 text-xs">
                      <div className="absolute left-2 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-blue-500 bg-slate-900" />
                      <div className="flex-1 p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200">{note.author_name}</span>
                          <span className="text-[11px] text-slate-400">{formatDateTime(note.created_at)}</span>
                        </div>
                        <p className="text-slate-300 leading-relaxed">{note.note_text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab 2: Supporting Evidence */}
        {activeTab === 'evidence' && (
          <Card className="border-slate-800 bg-slate-900/90 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-800">
              <CardTitle className="text-sm">Supporting Medical Evidence & Documents</CardTitle>
              <Button variant="primary" size="sm" onClick={() => setIsEvidenceModalOpen(true)} className="text-xs">
                <Upload className="h-3.5 w-3.5 mr-1" />
                Upload Evidence Document
              </Button>
            </CardHeader>
            <CardContent className="p-5">
              {evidence.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400">
                  No evidence documents attached to this case yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {evidence.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-3 text-xs"
                    >
                      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                        <FileCheck2 className="h-6 w-6" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <span className="font-semibold text-slate-100">{ev.title}</span>
                        {ev.description && <p className="text-[11px] text-slate-400">{ev.description}</p>}
                        <div className="flex items-center justify-between pt-2 text-[10px] text-slate-400 border-t border-slate-800/60">
                          <span>Uploaded by {ev.uploaded_by}</span>
                          <span>{formatDate(ev.uploaded_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tab 3: Member & Provider Cross History */}
        {activeTab === 'cross_audit' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Member History */}
            <Card className="border-slate-800 bg-slate-900/90">
              <CardHeader className="pb-3 border-b border-slate-800">
                <CardTitle className="text-sm flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-blue-400" />
                  Member Profile & Prior Claims
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <p className="font-bold text-slate-200">{claim_details.member?.first_name} {claim_details.member?.last_name}</p>
                  <p className="text-slate-400">Policy: {claim_details.member?.policy_tier} ({claim_details.member?.policy_number})</p>
                  <p className="text-slate-400">Age: {claim_details.member?.age} · Risk Score: {claim_details.member?.risk_score}/100</p>
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-slate-400 uppercase text-[11px] tracking-wider block">
                    Recent Claims:
                  </span>
                  {claim_details.related_claims?.map((rc: any) => (
                    <div key={rc.id} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between">
                      <div>
                        <span className="font-mono font-bold text-blue-400">{rc.id}</span>
                        <p className="text-[11px] text-slate-300">{rc.provider_name}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-200">{formatINR(rc.claim_amount)}</span>
                        <p className="text-[10px] text-slate-400">{formatDate(rc.claim_date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Provider Hospital History */}
            <Card className="border-slate-800 bg-slate-900/90">
              <CardHeader className="pb-3 border-b border-slate-800">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-purple-400" />
                  Provider Risk Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <p className="font-bold text-slate-200">{claim_details.provider?.name}</p>
                  <p className="text-slate-400">Location: {claim_details.provider?.city}, {claim_details.provider?.state}</p>
                  <div className="flex justify-between pt-1 font-semibold">
                    <span className="text-slate-400">Historical Fraud Rate:</span>
                    <span className="text-rose-400">{claim_details.provider?.historical_fraud_rate}%</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-400">Total Billed Claims:</span>
                    <span className="text-slate-200">{claim_details.provider?.historical_claims_count}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 4: Immutable Audit Trail */}
        {activeTab === 'audit_logs' && (
          <Card className="border-slate-800 bg-slate-900/90 shadow-xl">
            <CardHeader className="pb-3 border-b border-slate-800">
              <CardTitle className="text-sm flex items-center gap-2">
                <History className="h-4 w-4 text-amber-400" />
                Immutable Audit History for Case & Claim
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-slate-800/60 text-xs">
              {audit_history.length === 0 ? (
                <div className="p-6 text-center text-slate-400">No audit events recorded yet.</div>
              ) : (
                audit_history.map((a: any) => (
                  <div key={a.id} className="p-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-blue-400">{a.action}</span>
                      <span className="text-[11px] text-slate-400">{formatDateTime(a.timestamp)}</span>
                    </div>
                    <p className="text-slate-300">Actioned by: <span className="font-semibold text-slate-100">{a.user_email}</span></p>
                    {a.new_value && (
                      <div className="p-2 rounded bg-slate-950 font-mono text-[11px] text-slate-300 mt-1">
                        {typeof a.new_value === 'string' ? a.new_value : JSON.stringify(a.new_value)}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Decision Modal */}
      <Modal
        isOpen={isDecisionModalOpen}
        onClose={() => setIsDecisionModalOpen(false)}
        title="Record Investigation Decision"
        description="Submit your final clinical audit determination and close or escalate this SIU case."
      >
        <form onSubmit={handleDecision} className="space-y-4 text-xs">
          <div>
            <label className="text-xs text-slate-300 font-medium block mb-1">Decision Determination</label>
            <Select
              value={decisionType}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDecisionType(e.target.value)}
            >
              <option value="CONFIRMED_FRAUD">CONFIRMED FRAUD - Deny claim & blacklist pattern</option>
              <option value="FALSE_POSITIVE">FALSE POSITIVE - Clear claim & approve for payment</option>
              <option value="ESCALATED">ESCALATE - Refer to Legal / Senior Medical Director</option>
              <option value="CLOSED">CLOSED - Administrative resolution</option>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Clinical Rationale & Audit Justification (Mandatory)
            </label>
            <textarea
              required
              rows={4}
              value={decisionRationale}
              onChange={(e) => setDecisionRationale(e.target.value)}
              placeholder="Detail the clinical justifications, medical chart discrepancies, or provider verification notes..."
              className="w-full rounded-lg border border-slate-750 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsDecisionModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" size="sm" isLoading={isSubmitting}>
              Enforce & Record Decision
            </Button>
          </div>
        </form>
      </Modal>

      {/* Assign Investigator Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Investigator"
        description="Assign this SIU case to a dedicated fraud investigator."
      >
        <form onSubmit={handleAssign} className="space-y-4 text-xs">
          <div>
            <label className="text-xs text-slate-300 font-medium block mb-1">Select SIU Investigator</label>
            <Select
              value={selectedInvestigatorId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedInvestigatorId(e.target.value)}
            >
              <option value="">Select an investigator...</option>
              {investigators.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.first_name} {u.last_name} ({u.email}) - {u.department}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Assign Case
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Note Modal */}
      <Modal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        title="Add Investigation Note"
        description="Record an update, provider contact log, or clinical finding."
      >
        <form onSubmit={handleAddNote} className="space-y-4 text-xs">
          <div>
            <textarea
              required
              rows={4}
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="Enter detailed case note..."
              className="w-full rounded-lg border border-slate-750 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsNoteModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Save Note
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Evidence Modal */}
      <Modal
        isOpen={isEvidenceModalOpen}
        onClose={() => setIsEvidenceModalOpen(false)}
        title="Attach Evidence Document"
        description="Attach patient discharge summaries, billing invoices, or lab verification reports."
      >
        <form onSubmit={handleAddEvidence} className="space-y-4 text-xs">
          <Input
            label="Document Title"
            required
            value={evidenceTitle}
            onChange={(e) => setEvidenceTitle(e.target.value)}
            placeholder="e.g. Hospital Itemized Pharmacy Bill"
          />

          <div>
            <label className="text-xs text-slate-300 font-medium block mb-1">File Type</label>
            <Select
              value={evidenceType}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEvidenceType(e.target.value)}
            >
              <option value="PDF">PDF Document</option>
              <option value="JPG">JPG / Image Scan</option>
              <option value="PNG">PNG / Diagnostic Scan</option>
              <option value="DOCX">DOCX / Medical Summary</option>
            </Select>
          </div>

          <Input
            label="Description / Audit Context"
            value={evidenceDesc}
            onChange={(e) => setEvidenceDesc(e.target.value)}
            placeholder="e.g. Scanned copy received from hospital billing desk"
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEvidenceModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Attach Document
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
