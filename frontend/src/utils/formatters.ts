import type { RiskLevel, ClaimStatus, InvestigationStatus, FraudCategory } from '../types';

export function formatINR(amount: number, compact: boolean = false): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  
  if (compact) {
    if (Math.abs(amount) >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)} Cr`;
    }
    if (Math.abs(amount) >= 100000) {
      return `₹${(amount / 100000).toFixed(1)} Lakh`;
    }
    if (Math.abs(amount) >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}k`;
    }
  }

  // Standard Indian comma separator format
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString?: string | null): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
}

export function getRiskLevelDetails(level?: RiskLevel | string) {
  switch (level?.toUpperCase()) {
    case 'CRITICAL':
      return {
        label: 'Critical Risk',
        bgColor: 'bg-rose-500/15',
        borderColor: 'border-rose-500/40',
        textColor: 'text-rose-400',
        badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
        dotColor: 'bg-rose-500',
        gradient: 'from-rose-500 to-red-600',
        scoreRange: '85-100'
      };
    case 'HIGH':
      return {
        label: 'High Risk',
        bgColor: 'bg-orange-500/15',
        borderColor: 'border-orange-500/40',
        textColor: 'text-orange-400',
        badgeClass: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
        dotColor: 'bg-orange-500',
        gradient: 'from-orange-500 to-amber-600',
        scoreRange: '70-84'
      };
    case 'MEDIUM':
      return {
        label: 'Medium Risk',
        bgColor: 'bg-amber-500/15',
        borderColor: 'border-amber-500/40',
        textColor: 'text-amber-400',
        badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        dotColor: 'bg-amber-500',
        gradient: 'from-amber-500 to-yellow-600',
        scoreRange: '40-69'
      };
    case 'LOW':
      return {
        label: 'Low Risk',
        bgColor: 'bg-blue-500/15',
        borderColor: 'border-blue-500/40',
        textColor: 'text-blue-400',
        badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        dotColor: 'bg-blue-500',
        gradient: 'from-blue-500 to-cyan-600',
        scoreRange: '15-39'
      };
    case 'NORMAL':
    default:
      return {
        label: 'Normal',
        bgColor: 'bg-emerald-500/15',
        borderColor: 'border-emerald-500/40',
        textColor: 'text-emerald-400',
        badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        dotColor: 'bg-emerald-500',
        gradient: 'from-emerald-500 to-teal-600',
        scoreRange: '0-14'
      };
  }
}

export function getRiskBadgeVariant(level?: RiskLevel | string): 'danger' | 'warning' | 'default' | 'secondary' | 'success' {
  switch (level?.toUpperCase()) {
    case 'CRITICAL':
      return 'danger';
    case 'HIGH':
    case 'MEDIUM':
      return 'warning';
    case 'LOW':
      return 'default';
    case 'NORMAL':
    default:
      return 'success';
  }
}

export function getStatusBadgeVariant(status?: ClaimStatus | InvestigationStatus | string): 'danger' | 'warning' | 'default' | 'secondary' | 'success' {
  switch (status?.toUpperCase()) {
    case 'CONFIRMED_FRAUD':
    case 'REJECTED':
      return 'danger';
    case 'UNDER_INVESTIGATION':
    case 'UNDER_REVIEW':
    case 'PENDING_REVIEW':
    case 'ESCALATED':
      return 'warning';
    case 'APPROVED':
    case 'CLOSED':
      return 'success';
    case 'ASSIGNED':
    case 'INFORMATION_REQUIRED':
      return 'default';
    default:
      return 'secondary';
  }
}

export function getClaimStatusBadge(status?: ClaimStatus | string) {
  switch (status) {
    case 'CONFIRMED_FRAUD':
      return { label: 'Confirmed Fraud', className: 'bg-rose-950/60 text-rose-400 border-rose-700/50' };
    case 'UNDER_INVESTIGATION':
      return { label: 'Under Investigation', className: 'bg-amber-950/60 text-amber-400 border-amber-700/50' };
    case 'APPROVED':
      return { label: 'Approved', className: 'bg-emerald-950/60 text-emerald-400 border-emerald-700/50' };
    case 'REJECTED':
      return { label: 'Rejected', className: 'bg-slate-800 text-slate-400 border-slate-700' };
    case 'PENDING_REVIEW':
      return { label: 'Pending Review', className: 'bg-blue-950/60 text-blue-400 border-blue-700/50' };
    case 'SUBMITTED':
    default:
      return { label: 'Submitted', className: 'bg-indigo-950/60 text-indigo-400 border-indigo-700/50' };
  }
}

export function getInvestigationStatusBadge(status?: InvestigationStatus | string) {
  switch (status) {
    case 'CONFIRMED_FRAUD':
      return { label: 'Confirmed Fraud', className: 'bg-rose-950/60 text-rose-400 border-rose-700/50' };
    case 'FALSE_POSITIVE':
      return { label: 'False Positive', className: 'bg-emerald-950/60 text-emerald-400 border-emerald-700/50' };
    case 'UNDER_REVIEW':
      return { label: 'Under Review', className: 'bg-blue-950/60 text-blue-400 border-blue-700/50' };
    case 'ASSIGNED':
      return { label: 'Assigned', className: 'bg-purple-950/60 text-purple-400 border-purple-700/50' };
    case 'INFORMATION_REQUIRED':
      return { label: 'Info Required', className: 'bg-amber-950/60 text-amber-400 border-amber-700/50' };
    case 'ESCALATED':
      return { label: 'Escalated', className: 'bg-orange-950/60 text-orange-400 border-orange-700/50' };
    case 'CLOSED':
      return { label: 'Closed', className: 'bg-slate-800 text-slate-400 border-slate-700' };
    case 'NEW':
    default:
      return { label: 'New Alert', className: 'bg-cyan-950/60 text-cyan-400 border-cyan-700/50' };
  }
}

export function getFraudCategoryLabel(category?: FraudCategory | string) {
  switch (category) {
    case 'BILLING_FRAUD':
      return 'Excessive Billing';
    case 'PROVIDER_FRAUD':
      return 'Provider Collusion';
    case 'MEMBER_FRAUD':
      return 'Member Frequency Fraud';
    case 'DUPLICATE_CLAIM':
      return 'Duplicate Claim';
    case 'UPCODING':
      return 'Upcoding Procedure';
    case 'PHANTOM_SERVICES':
      return 'Phantom Services';
    case 'UNNECESSARY_HOSPITALIZATION':
      return 'Unnecessary Hospitalization';
    case 'IDENTITY_FRAUD':
      return 'Identity Impersonation';
    case 'PRESCRIPTION_FRAUD':
      return 'Prescription Fraud';
    default:
      return category || 'Unclassified';
  }
}
