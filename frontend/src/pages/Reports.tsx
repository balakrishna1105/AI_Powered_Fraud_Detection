import React, { useState, useEffect } from 'react';
import { reportsApi } from '../api/reports';
import type { ReportJob, ReportType, ReportStatus } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Pagination } from '../components/ui/Table';
import { formatDate } from '../utils/formatters';
import {
  FileSpreadsheet,
  Download,
  PlusCircle,
  FileText,
  Building2,
  Users2,
  LineChart,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  RefreshCw,
  Sparkles,
  SearchCode
} from 'lucide-react';

const REPORT_TEMPLATES: {
  type: ReportType;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: string;
}[] = [
  {
    type: 'FRAUD_SUMMARY',
    title: 'Executive Fraud Summary',
    description: 'High-level aggregation of total claims, fraud loss exposure, detection rate, and recovery stats.',
    icon: <BarChart3 className="h-6 w-6 text-blue-400" />,
    category: 'Executive & Financial',
  },
  {
    type: 'PROVIDER_FRAUD',
    title: 'Provider Risk & Outlier Audit',
    description: 'Ranked analysis of hospital networks, billing deviations, upcoding frequency, and fraud flags.',
    icon: <Building2 className="h-6 w-6 text-purple-400" />,
    category: 'Network Auditing',
  },
  {
    type: 'MEMBER_FRAUD',
    title: 'Policyholder Abuse & Anomaly Report',
    description: 'Identifies policy hopping, overlapping admissions, and repetitive high-cost claim patterns.',
    icon: <Users2 className="h-6 w-6 text-indigo-400" />,
    category: 'Underwriting & Risk',
  },
  {
    type: 'INVESTIGATOR_PERFORMANCE',
    title: 'SIU Case Resolution & ROI',
    description: 'Workforce productivity metrics, average case close duration, and confirmed fraud recovery value.',
    icon: <SearchCode className="h-6 w-6 text-emerald-400" />,
    category: 'Operations',
  },
  {
    type: 'FRAUD_TRENDS',
    title: 'Temporal Fraud Trends & Forecasting',
    description: 'Time-series analysis of emerging fraud vectors, seasonal spikes, and detection engine accuracy.',
    icon: <LineChart className="h-6 w-6 text-amber-400" />,
    category: 'Intelligence & ML',
  },
];

export const Reports: React.FC = () => {
  const [reports, setReports] = useState<ReportJob[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal & Generation
  const [isGenerateOpen, setIsGenerateOpen] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportType>('FRAUD_SUMMARY');
  const [reportTitle, setReportTitle] = useState<string>('Monthly Executive Fraud Report');
  const [fileFormat, setFileFormat] = useState<string>('CSV');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const data = await reportsApi.listReports(currentPage, 10);
      setReports(data.items);
      setTotalItems(data.total);
      setTotalPages(data.total_pages);
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [currentPage]);

  const handleSelectTemplate = (tpl: typeof REPORT_TEMPLATES[0]) => {
    setSelectedTemplate(tpl.type);
    setReportTitle(`${tpl.title} - ${new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`);
    setIsGenerateOpen(true);
  };

  const handleGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setActionError(null);
    try {
      await reportsApi.generateReport({
        title: reportTitle,
        report_type: selectedTemplate,
        file_format: fileFormat,
        filters: { risk_level: riskFilter !== 'ALL' ? riskFilter : undefined },
      });
      setIsGenerateOpen(false);
      setActionSuccess('Report generated successfully and ready for export');
      setTimeout(() => setActionSuccess(null), 4000);
      loadReports();
    } catch (err: any) {
      setActionError(err.message || 'Failed to generate report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDirectDownload = (report: ReportJob) => {
    const token = localStorage.getItem('hg_auth_token');
    const url = `/api/v1/reports/${report.id}/download`;
    
    fetch(url, {
      headers: {
        Authorization: `Bearer ${token || ''}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('File download failed');
        return res.blob();
      })
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${report.title.replace(/\s+/g, '_')}_${report.id}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
      })
      .catch((err) => {
        console.error('Download error:', err);
        alert('Could not download report file.');
      });
  };

  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success">COMPLETED</Badge>;
      case 'PROCESSING':
        return <Badge variant="warning">PROCESSING</Badge>;
      case 'FAILED':
        return <Badge variant="danger">FAILED</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <FileSpreadsheet className="h-7 w-7 text-blue-500" />
            Compliance & Fraud Intelligence Reporting
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Generate enterprise audits, regulatory compliance extracts (IRDAI/SIU format), and executive intelligence summaries.
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedTemplate('FRAUD_SUMMARY');
            setReportTitle(`Executive Summary - ${new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`);
            setIsGenerateOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Custom Report
        </Button>
      </div>

      {/* Success Notification */}
      {actionSuccess && (
        <div className="bg-emerald-950/60 border border-emerald-600/50 text-emerald-300 px-4 py-3 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          {actionSuccess}
        </div>
      )}

      {/* Report Templates Section */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-400" /> Pre-Configured SIU & Audit Templates
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {REPORT_TEMPLATES.map((tpl) => (
            <Card
              key={tpl.type}
              className="border-slate-800 bg-slate-900/90 hover:border-blue-500/50 hover:bg-slate-855 transition-all cursor-pointer group shadow-md"
              onClick={() => handleSelectTemplate(tpl)}
            >
              <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 group-hover:border-blue-500/40 transition-colors">
                      {tpl.icon}
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {tpl.category}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                      {tpl.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {tpl.description}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-blue-400 font-medium">
                  <span>Generate Report</span>
                  <PlusCircle className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Generated Reports History Table */}
      <Card className="border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden mt-8">
        <CardHeader className="border-b border-slate-800/80 flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
              <FileText className="h-4.5 w-4.5 text-blue-400" />
              Generated Report History
            </CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">
              Archive of all extracted datasets and compliance reports.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={loadReports} className="text-xs text-slate-300">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
          </Button>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Report Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Format</TableHead>
              <TableHead>Row Count</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Generated At</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-slate-400">
                  Loading report archive...
                </TableCell>
              </TableRow>
            ) : reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-slate-400 text-xs">
                  No reports generated yet. Pick a template above to produce an audit file.
                </TableCell>
              </TableRow>
            ) : (
              reports.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-semibold text-white text-xs">
                    {r.title}
                  </TableCell>
                  <TableCell>
                    <span className="text-[11px] font-mono text-blue-300 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-900/50">
                      {r.report_type}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-slate-300 font-mono">
                    {r.file_format || 'CSV'}
                  </TableCell>
                  <TableCell className="text-xs text-slate-200 font-mono font-bold">
                    {r.row_count ? `${r.row_count} rows` : 'N/A'}
                  </TableCell>
                  <TableCell className="text-xs text-slate-400">
                    {r.created_by}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(r.status)}
                  </TableCell>
                  <TableCell className="text-xs text-slate-400">
                    {formatDate(r.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDirectDownload(r)}
                      disabled={r.status !== 'COMPLETED'}
                      className="text-xs h-8 text-blue-400 hover:text-blue-300"
                    >
                      <Download className="h-3.5 w-3.5 mr-1" />
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={10}
          onPageChange={(p) => setCurrentPage(p)}
        />
      </Card>

      {/* Generate Report Modal */}
      <Modal
        isOpen={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
        title="Configure & Generate Report"
        description="Select report parameters and output formats."
        size="md"
      >
        <form onSubmit={handleGenerateSubmit} className="space-y-4 pt-2">
          {actionError && (
            <div className="p-3 bg-rose-950/70 border border-rose-700/60 rounded-lg text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              {actionError}
            </div>
          )}

          <div>
            <label className="text-xs text-slate-300 font-medium block mb-1">Report Template *</label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value as ReportType)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-blue-500"
            >
              {REPORT_TEMPLATES.map((t) => (
                <option key={t.type} value={t.type}>
                  {t.title} ({t.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-300 font-medium block mb-1">Report Title *</label>
            <Input
              required
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              placeholder="e.g. Q3 Healthcare Fraud Summary Report"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">Risk Filter</label>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-blue-500"
              >
                <option value="ALL">All Risk Levels</option>
                <option value="CRITICAL">Critical Risk (80-100) Only</option>
                <option value="HIGH">High Risk (60-79)+</option>
                <option value="MEDIUM">Medium Risk (30-59)+</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">Export Format</label>
              <select
                value={fileFormat}
                onChange={(e) => setFileFormat(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-blue-500"
              >
                <option value="CSV">CSV Spreadsheet (.csv)</option>
                <option value="EXCEL">Excel Compatible (.xlsx)</option>
                <option value="JSON">Raw JSON Data Stream</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800/80 text-xs text-slate-400 space-y-1">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
              Automated Data Pipeline
            </div>
            <p>
              The engine will query live transaction tables, join statistical indicators, and generate an immutable export file stored in the SIU archive.
            </p>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsGenerateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Generate Report
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
