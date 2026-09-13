import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { providersApi } from '../api/providers';
import type { ProviderDetail as ProviderDetailType } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { RiskBadge } from '../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { formatINR, formatDate, getClaimStatusBadge } from '../utils/formatters';
import {
  ArrowLeft,
  AlertTriangle,
  FileSpreadsheet,
  ShieldAlert,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const ProviderDetail: React.FC = () => {
  const { providerId } = useParams<{ providerId: string }>();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<ProviderDetailType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadDetail = async () => {
      if (!providerId) return;
      setIsLoading(true);
      try {
        const data = await providersApi.getProviderDetail(providerId);
        setDetail(data);
      } catch (err) {
        console.error('Failed to load provider detail', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadDetail();
  }, [providerId]);

  if (isLoading) {
    return <div className="py-20 text-center text-slate-400">Loading provider risk profile...</div>;
  }

  if (!detail) {
    return (
      <div className="py-20 text-center text-slate-400 space-y-4">
        <p>Provider '{providerId}' not found.</p>
        <Button variant="secondary" onClick={() => navigate('/providers')}>Back to Providers</Button>
      </div>
    );
  }

  const { provider: p, peer_avg_claim_amount, peer_avg_fraud_rate, common_procedures, fraud_trend, risk_indicators, claims } = detail;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/providers')} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white">{p.name}</h1>
            <span className="font-mono text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">{p.id}</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{p.address} · {p.city}, {p.state}</p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-slate-800 bg-slate-900/90 p-4">
          <span className="text-xs text-slate-400 font-semibold uppercase">Provider Risk Score</span>
          <p className="text-2xl font-bold font-mono text-rose-400 mt-1">{p.risk_score}/100</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Peer avg: {detail.peer_avg_risk_score}/100</span>
        </Card>
        <Card className="border-slate-800 bg-slate-900/90 p-4">
          <span className="text-xs text-slate-400 font-semibold uppercase">Historical Fraud Rate</span>
          <p className="text-2xl font-bold font-mono text-amber-400 mt-1">{p.historical_fraud_rate}%</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Peer state avg: {peer_avg_fraud_rate}%</span>
        </Card>
        <Card className="border-slate-800 bg-slate-900/90 p-4">
          <span className="text-xs text-slate-400 font-semibold uppercase">Avg Claim Size</span>
          <p className="text-2xl font-bold font-mono text-white mt-1">{formatINR(p.avg_claim_amount)}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Peer avg: {formatINR(peer_avg_claim_amount)}</span>
        </Card>
        <Card className="border-slate-800 bg-slate-900/90 p-4">
          <span className="text-xs text-slate-400 font-semibold uppercase">Total Billed Volume</span>
          <p className="text-2xl font-bold font-mono text-blue-400 mt-1">{p.historical_claims_count}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">{p.historical_fraud_count} confirmed fraud incidents</span>
        </Card>
      </div>

      {/* Risk Indicators Callout */}
      {risk_indicators && risk_indicators.length > 0 && (
        <Card className="border-rose-900/40 bg-rose-950/20 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-rose-300 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-400" />
              Special Investigation Risk Indicators
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 pt-0">
            {risk_indicators.map((ind, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-rose-200">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
                <span>{ind}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Common Procedures & Trend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-800 bg-slate-900/90">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">High Frequency Billed Procedures</CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-slate-800 text-xs">
            {common_procedures.map((proc, i) => (
              <div key={i} className="p-3.5 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-200">{proc.name}</span>
                  <p className="font-mono text-[11px] text-purple-400">{proc.procedure}</p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-100">{formatINR(proc.avg_cost)}</span>
                  <p className="text-[11px] text-slate-400">{proc.count} claims</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/90">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Monthly Claims vs Confirmed Fraud Trend</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fraud_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Bar dataKey="claims" name="Total Claims" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="fraud_count" name="Confirmed Fraud" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Provider Claims Feed */}
      <Card className="border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-800">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-blue-400" />
            Recent Claims Scored for this Hospital
          </CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Claim ID</TableHead>
              <TableHead>Member</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Diagnosis / Procedure</TableHead>
              <TableHead>Risk Score</TableHead>
              <TableHead>Risk Level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {claims.map((c) => {
              const statusBadge = getClaimStatusBadge(c.claim_status);
              return (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-bold text-blue-400">{c.id}</TableCell>
                  <TableCell className="text-xs">{c.member_name}</TableCell>
                  <TableCell className="text-xs text-slate-300">{formatDate(c.claim_date)}</TableCell>
                  <TableCell className="font-mono font-bold text-slate-100">{formatINR(c.claim_amount)}</TableCell>
                  <TableCell className="text-xs">{c.diagnosis_codes?.[0] || 'N/A'}</TableCell>
                  <TableCell className="font-mono font-bold text-xs text-rose-400">{c.fraud_score?.toFixed(0) || '0'}/100</TableCell>
                  <TableCell><RiskBadge level={c.risk_level} size="sm" /></TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusBadge.className}`}>
                      {statusBadge.label}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="secondary" size="sm" onClick={() => navigate(`/claims/${c.id}`)} className="text-xs h-7">
                      Inspect
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
