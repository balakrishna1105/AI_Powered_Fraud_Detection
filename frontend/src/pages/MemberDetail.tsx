import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { membersApi } from '../api/providers';
import type { MemberDetail as MemberDetailType } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { RiskGauge } from '../components/ui/RiskGauge';
import { formatINR, formatDate, getRiskBadgeVariant, getStatusBadgeVariant } from '../utils/formatters';
import {
  ArrowLeft,
  User,
  ShieldAlert,
  AlertTriangle,
  Calendar,
  CreditCard,
  Building2,
  Activity,
  FileText,
  Clock,
  ExternalLink,
  MapPin,
  TrendingUp
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export const MemberDetail: React.FC = () => {
  const { memberId } = useParams<{ memberId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<MemberDetailType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!memberId) return;
    const fetchMember = async () => {
      setIsLoading(true);
      try {
        const res = await membersApi.getMemberDetail(memberId);
        setData(res);
      } catch (err: any) {
        console.error('Failed to load member details', err);
        setError(err?.message || 'Failed to load policyholder details');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMember();
  }, [memberId]);

  if (isLoading) {
    return (
      <div className="py-24 text-center text-slate-400">
        <Activity className="h-8 w-8 animate-spin mx-auto text-blue-500 mb-3" />
        <p>Loading policyholder profile and history...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-16 text-center">
        <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
        <p className="text-white text-lg font-semibold">{error || 'Policyholder not found'}</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/members')}>
          Back to Members
        </Button>
      </div>
    );
  }

  const { member, hospitalization_history, provider_relationships, suspicious_patterns, risk_timeline, claims } = data;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Back button & Title */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/members')}
          className="text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Members
        </Button>
      </div>

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-blue-950/80 border border-blue-600/30 flex items-center justify-center shrink-0">
              <User className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  {member.first_name} {member.last_name}
                </h1>
                <Badge variant={getRiskBadgeVariant(member.risk_score >= 70 ? 'CRITICAL' : member.risk_score >= 40 ? 'MEDIUM' : 'LOW')}>
                  Risk Score: {member.risk_score}/100
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-400 mt-2">
                <span className="font-mono text-slate-300">ID: {member.id}</span>
                <span>•</span>
                <span>{member.age} years · {member.gender}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-slate-500" /> {member.city}, {member.state}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <CreditCard className="h-3 w-3 text-slate-500" /> Policy: <strong className="text-slate-200 font-mono">{member.policy_number}</strong> ({member.policy_tier})
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 self-end lg:self-center bg-slate-950/50 p-3 rounded-lg border border-slate-800">
            <div className="text-center px-2">
              <span className="text-[11px] text-slate-400 block uppercase font-medium">Claims</span>
              <span className="text-xl font-bold text-white font-mono">{member.claims_count}</span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="text-center px-2">
              <span className="text-[11px] text-slate-400 block uppercase font-medium">Suspicious</span>
              <span className="text-xl font-bold text-rose-400 font-mono">{member.suspicious_claims_count}</span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="text-center px-2">
              <span className="text-[11px] text-slate-400 block uppercase font-medium">Total Billed</span>
              <span className="text-xl font-bold text-emerald-400 font-mono">{formatINR(member.total_claim_value)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Suspicious Patterns Alert if present */}
      {suspicious_patterns && suspicious_patterns.length > 0 && (
        <div className="bg-rose-950/30 border border-rose-800/60 rounded-xl p-4.5 flex items-start gap-3.5">
          <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-rose-200">Suspicious Behavioral Flags Detected</h3>
            <ul className="list-disc list-inside text-xs text-rose-300/90 space-y-0.5">
              {suspicious_patterns.map((pat, idx) => (
                <li key={idx}>{pat}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Grid: Risk Gauge & Trajectory, Provider Relationships */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Assessment Gauge */}
        <Card className="border-slate-800 bg-slate-900 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-400" />
              Member Risk Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
            <RiskGauge score={member.risk_score} size={150} />
            <div className="text-center space-y-1 w-full bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
              <div className="flex justify-between text-xs py-1 border-b border-slate-800">
                <span className="text-slate-400">Policy Inception:</span>
                <span className="text-slate-200 font-mono">{formatDate(member.policy_start_date)}</span>
              </div>
              <div className="flex justify-between text-xs py-1">
                <span className="text-slate-400">Suspicious Ratio:</span>
                <span className="text-rose-400 font-bold font-mono">
                  {member.claims_count > 0 ? ((member.suspicious_claims_count / member.claims_count) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Trajectory Chart */}
        <Card className="border-slate-800 bg-slate-900 shadow-md lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              Member Risk Trajectory
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {risk_timeline && risk_timeline.length > 0 ? (
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={risk_timeline} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                    <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '12px' }}
                      formatter={(val: any) => [`${val}/100`, 'Risk Score']}
                    />
                    <Line
                      type="monotone"
                      dataKey="risk_score"
                      stroke="#f43f5e"
                      strokeWidth={2.5}
                      dot={{ fill: '#f43f5e', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-60 flex items-center justify-center text-xs text-slate-500">
                No historical risk variance recorded.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hospitalization History & Provider Network */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hospitalization History */}
        <Card className="border-slate-800 bg-slate-900 shadow-md">
          <CardHeader className="pb-3 border-b border-slate-800/80">
            <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-400" />
              Hospitalization Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {hospitalization_history && hospitalization_history.length > 0 ? (
              <div className="divide-y divide-slate-800 max-h-72 overflow-y-auto">
                {hospitalization_history.map((hosp, i) => (
                  <div key={i} className="p-4 hover:bg-slate-800/30 transition-colors flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-2">
                        <span>{hosp.hospital}</span>
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-blue-400 border-blue-500/30">
                          {hosp.days} {hosp.days === 1 ? 'Day' : 'Days'} Stay
                        </Badge>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-slate-500" /> Admission: {formatDate(hosp.admission)}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xs font-bold text-slate-200 block">
                        {formatINR(hosp.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="p-6 text-xs text-slate-500 text-center">No inpatient hospitalizations recorded.</p>
            )}
          </CardContent>
        </Card>

        {/* Frequent Providers */}
        <Card className="border-slate-800 bg-slate-900 shadow-md">
          <CardHeader className="pb-3 border-b border-slate-800/80">
            <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-indigo-400" />
              Provider Relationships
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {provider_relationships && provider_relationships.length > 0 ? (
              <div className="divide-y divide-slate-800 max-h-72 overflow-y-auto">
                {provider_relationships.map((rel, i) => (
                  <div key={i} className="p-4 hover:bg-slate-800/30 transition-colors flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-white">{rel.provider}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Last Visit: {formatDate(rel.last_visit)}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="text-[11px] font-mono">
                        {rel.claims_count} {rel.claims_count === 1 ? 'claim' : 'claims'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="p-6 text-xs text-slate-500 text-center">No provider affiliations mapped.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Member Claims List */}
      <Card className="border-slate-800 bg-slate-900 shadow-xl overflow-hidden">
        <CardHeader className="border-b border-slate-800/80">
          <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-400" />
            Claims History for Policyholder ({claims.length})
          </CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Claim ID</TableHead>
              <TableHead>Claim Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Risk Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {claims.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-slate-500 text-xs">
                  No claims found for this policyholder.
                </TableCell>
              </TableRow>
            ) : (
              claims.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-bold text-blue-400 text-xs">
                    {c.id}
                  </TableCell>
                  <TableCell className="text-xs text-slate-300">
                    {formatDate(c.claim_date)}
                  </TableCell>
                  <TableCell className="text-xs text-slate-300">
                    {c.claim_type}
                  </TableCell>
                  <TableCell className="text-xs text-slate-200 max-w-[200px] truncate">
                    {c.provider_name || c.provider_id}
                  </TableCell>
                  <TableCell className="font-mono font-bold text-xs text-slate-100">
                    {formatINR(c.claim_amount)}
                  </TableCell>
                  <TableCell>
                    {c.fraud_score !== undefined ? (
                      <Badge variant={getRiskBadgeVariant(c.risk_level || 'NORMAL')} size="sm">
                        {c.fraud_score}/100
                      </Badge>
                    ) : (
                      <span className="text-slate-500 text-xs">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(c.claim_status)} size="sm">
                      {c.claim_status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/claims/${c.id}`)}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      <ExternalLink className="h-3.5 w-3.5 mr-1" /> View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
