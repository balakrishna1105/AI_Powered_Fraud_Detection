import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../api/dashboard';
import type {
  DashboardSummary,
  FraudTrend,
  FraudByCategory,
  FraudByRegion,
  TopProvider,
  HighPriorityAlert,
} from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { RiskBadge } from '../components/ui/Badge';
import { formatINR } from '../utils/formatters';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import {
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  IndianRupee,
  ShieldCheck,
  Building2,
  Users,
  SearchCode,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';

const CATEGORY_COLORS = [
  '#ef4444', // Rose/Red (Upcoding)
  '#f97316', // Orange (Duplicate)
  '#f59e0b', // Amber (Billing)
  '#3b82f6', // Blue (Hospitalization)
  '#8b5cf6', // Purple (Provider)
  '#06b6d4', // Cyan (Phantom)
  '#10b981', // Emerald (Prescription)
  '#64748b', // Slate (Identity)
];

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trendPeriod, setTrendPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [trends, setTrends] = useState<FraudTrend[]>([]);
  const [categories, setCategories] = useState<FraudByCategory[]>([]);
  const [regions, setRegions] = useState<FraudByRegion[]>([]);
  const [providers, setProviders] = useState<TopProvider[]>([]);
  const [alerts, setAlerts] = useState<HighPriorityAlert[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [sumData, trendData, catData, regData, provData, alertData] = await Promise.all([
        dashboardApi.getSummary(),
        dashboardApi.getFraudTrends(trendPeriod),
        dashboardApi.getFraudByCategory(),
        dashboardApi.getFraudByRegion(),
        dashboardApi.getTopProviders(),
        dashboardApi.getHighPriorityAlerts(6),
      ]);
      setSummary(sumData);
      setTrends(trendData);
      setCategories(catData);
      setRegions(regData);
      setProviders(provData);
      setAlerts(alertData);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [trendPeriod]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <ShieldAlert className="h-7 w-7 text-blue-500" />
            Health Insurance Fraud Detection Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time fraud surveillance, ML risk calibration, and special investigation workflow metrics.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
            isLoading={isLoading}
            className="text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Refresh Analytics
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/investigations')}
            className="text-xs"
          >
            <SearchCode className="h-3.5 w-3.5 mr-1" />
            Investigation Queue
          </Button>
        </div>
      </div>

      {/* 8 Top KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Claims */}
        <Card
          hoverEffect
          onClick={() => navigate('/claims')}
          className="cursor-pointer border-slate-800 bg-slate-900/90"
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Claims
              </span>
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-white font-mono">
                {summary?.total_claims ? summary.total_claims.toLocaleString('en-IN') : '125,430'}
              </span>
              <span className="flex items-center text-xs font-semibold text-emerald-400">
                <TrendingUp className="h-3.5 w-3.5 mr-0.5" />
                +{summary?.total_claims_growth || 8.4}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">vs previous monthly period</p>
          </CardContent>
        </Card>

        {/* KPI 2: Claims Analyzed */}
        <Card hoverEffect className="border-slate-800 bg-slate-900/90">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Claims Analyzed
              </span>
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-white font-mono">
                {summary?.claims_analyzed ? summary.claims_analyzed.toLocaleString('en-IN') : '118,920'}
              </span>
              <span className="flex items-center text-xs font-semibold text-emerald-400">
                <TrendingUp className="h-3.5 w-3.5 mr-0.5" />
                +{summary?.claims_analyzed_growth || 7.9}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">94.8% auto-scoring coverage</p>
          </CardContent>
        </Card>

        {/* KPI 3: Suspicious Claims */}
        <Card
          hoverEffect
          onClick={() => navigate('/claims?risk_level=HIGH')}
          className="cursor-pointer border-slate-800 bg-slate-900/90"
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                Suspicious Claims
              </span>
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-amber-400 font-mono">
                {summary?.suspicious_claims ? summary.suspicious_claims.toLocaleString('en-IN') : '4,825'}
              </span>
              <span className="flex items-center text-xs font-semibold text-emerald-400">
                <TrendingDown className="h-3.5 w-3.5 mr-0.5" />
                {summary?.suspicious_claims_growth || -4.2}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Flagged for investigation</p>
          </CardContent>
        </Card>

        {/* KPI 4: Confirmed Fraud */}
        <Card
          hoverEffect
          onClick={() => navigate('/investigations?status=CONFIRMED_FRAUD')}
          className="cursor-pointer border-slate-800 bg-slate-900/90"
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
                Confirmed Fraud
              </span>
              <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
                <ShieldAlert className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-rose-400 font-mono">
                {summary?.confirmed_fraud ? summary.confirmed_fraud.toLocaleString('en-IN') : '1,238'}
              </span>
              <span className="flex items-center text-xs font-semibold text-rose-400">
                <TrendingUp className="h-3.5 w-3.5 mr-0.5" />
                +{summary?.confirmed_fraud_growth || 12.1}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">SIU verified decisions</p>
          </CardContent>
        </Card>

        {/* KPI 5: Potential Fraud Amount */}
        <Card hoverEffect className="border-slate-800 bg-slate-900/90">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Potential Fraud Amount
              </span>
              <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
                <IndianRupee className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-orange-400 font-mono">
                {formatINR(summary?.potential_fraud_amount || 186000000, true)}
              </span>
              <span className="flex items-center text-xs font-semibold text-rose-400">
                <TrendingUp className="h-3.5 w-3.5 mr-0.5" />
                +{summary?.potential_fraud_amount_growth || 5.6}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Gross at-risk exposure</p>
          </CardContent>
        </Card>

        {/* KPI 6: Fraud Prevented */}
        <Card hoverEffect className="border-slate-800 bg-slate-900/90">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Fraud Prevented
              </span>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <CheckCircle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-emerald-400 font-mono">
                {formatINR(summary?.fraud_prevented || 124000000, true)}
              </span>
              <span className="flex items-center text-xs font-semibold text-emerald-400">
                <TrendingUp className="h-3.5 w-3.5 mr-0.5" />
                +{summary?.fraud_prevented_growth || 18.2}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Direct losses saved</p>
          </CardContent>
        </Card>

        {/* KPI 7: Detection Rate */}
        <Card hoverEffect className="border-slate-800 bg-slate-900/90">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                Detection Rate
              </span>
              <div className="h-8 w-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-white font-mono">
                {summary?.detection_rate || 94.2}%
              </span>
              <span className="flex items-center text-xs font-semibold text-emerald-400">
                <TrendingUp className="h-3.5 w-3.5 mr-0.5" />
                +{summary?.detection_rate_change || 1.8}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Model accuracy benchmark</p>
          </CardContent>
        </Card>

        {/* KPI 8: False Positive Rate */}
        <Card hoverEffect className="border-slate-800 bg-slate-900/90">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                False Positive Rate
              </span>
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-white font-mono">
                {summary?.false_positive_rate || 5.8}%
              </span>
              <span className="flex items-center text-xs font-semibold text-emerald-400">
                <TrendingDown className="h-3.5 w-3.5 mr-0.5" />
                {summary?.false_positive_rate_change || -0.9}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Controlled review overhead</p>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Fraud Trend Chart & Fraud By Category */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fraud Trend Line Chart (2 Cols) */}
        <Card className="lg:col-span-2 border-slate-800 bg-slate-900/90">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Fraud Incident Trend</CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Claims received vs suspicious alerts vs confirmed fraud
              </p>
            </div>
            {/* Time Range Selector */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              {(['7d', '30d', '90d', '1y'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setTrendPeriod(period)}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    trendPeriod === period
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {period.toUpperCase()}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Line
                    type="monotone"
                    dataKey="total_claims"
                    name="Claims Received"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="suspicious_claims"
                    name="Suspicious Claims"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="confirmed_fraud"
                    name="Confirmed Fraud"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Fraud By Category Donut Chart (1 Col) */}
        <Card className="border-slate-800 bg-slate-900/90">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Fraud by Category</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">Distribution of detected fraud typologies</p>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categories}
                    dataKey="percentage"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {categories.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`${value}%`, 'Share']}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2 text-[11px]">
              {categories.slice(0, 6).map((cat, idx) => (
                <div key={cat.category} className="flex items-center gap-1.5 truncate">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                  />
                  <span className="text-slate-300 truncate">{cat.label}</span>
                  <span className="font-mono text-slate-400 font-bold ml-auto">{cat.percentage}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Regional Fraud Distribution & Top Risky Providers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fraud by Region */}
        <Card className="border-slate-800 bg-slate-900/90">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Fraud Distribution by Region</CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">State-level fraud risk across major healthcare hubs</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2.5">
              {regions.map((r) => (
                <div key={r.state} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200">{r.state}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-sm ${
                        r.risk_level === 'HIGH' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' :
                        r.risk_level === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                        'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                      }`}>
                        {r.risk_level}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {r.total_claims.toLocaleString('en-IN')} claims · {r.suspicious_claims} suspicious
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-200">
                      {formatINR(r.fraud_amount, true)}
                    </span>
                    <p className="text-[11px] text-amber-400 font-semibold">{r.fraud_rate}% fraud rate</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Risky Providers Bar Chart */}
        <Card className="border-slate-800 bg-slate-900/90">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">High Risk Provider Leaderboard</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">Providers with highest suspicious volume and fraud score</p>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={providers} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={11} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="#64748b"
                    fontSize={10}
                    width={110}
                    tickFormatter={(val) => (val.length > 16 ? `${val.substring(0, 16)}...` : val)}
                  />
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      name === 'risk_score' ? `${value}/100` : value,
                      name === 'risk_score' ? 'Risk Score' : 'Suspicious Claims',
                    ]}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="risk_score" name="Risk Score" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 4: High Priority Fraud Alert Panel */}
      <Card className="border-slate-800 bg-slate-900/90 shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-400" />
              High Priority Fraud Alerts
            </CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">
              Immediate attention queue: Critical & High risk claims flagged by ensemble engine
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/claims?risk_level=HIGH')}
            className="text-xs"
          >
            View All Filtered
            <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-slate-800">
          {alerts.map((alert) => (
            <div
              key={alert.claim_id}
              className="p-4 hover:bg-slate-850/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-bold text-blue-400">
                    {alert.claim_id}
                  </span>
                  <RiskBadge level={alert.risk_level} size="sm" />
                  <span className="text-xs text-slate-400 font-mono font-semibold">
                    Score: {alert.fraud_score}/100
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">· {alert.claim_date}</span>
                </div>

                <div className="text-xs text-slate-300 flex items-center gap-2">
                  <span className="font-medium text-slate-100">{alert.member_name} ({alert.member_id})</span>
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-300 flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    {alert.provider_name}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {alert.fraud_indicators.map((ind, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[11px]"
                    >
                      <AlertTriangle className="h-3 w-3 text-rose-400" />
                      {ind}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between md:flex-col md:items-end gap-2 shrink-0">
                <span className="text-lg font-extrabold text-white font-mono">
                  {formatINR(alert.claim_amount)}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/claims/${alert.claim_id}`)}
                    className="text-xs h-8"
                  >
                    Claim Details
                  </Button>
                  {alert.investigation_id ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/investigations/${alert.investigation_id}`)}
                      className="text-xs h-8"
                    >
                      SIU Workbench
                    </Button>
                  ) : (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => navigate(`/claims/${alert.claim_id}`)}
                      className="text-xs h-8"
                    >
                      Investigate
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
