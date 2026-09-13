import React, { useState, useEffect } from 'react';
import { auditApi } from '../api/audit';
import type { AuditLog } from '../types';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Pagination } from '../components/ui/Table';
import { formatDate } from '../utils/formatters';
import {
  ShieldCheck,
  Search,
  RefreshCw,
  Eye,
  User,
  History,
  Lock,
  ArrowRight
} from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(15);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [userEmail, setUserEmail] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [resourceFilter, setResourceFilter] = useState<string>('');
  const [resourceId, setResourceId] = useState<string>('');

  // Diff Modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDiffOpen, setIsDiffOpen] = useState<boolean>(false);

  const loadAuditLogs = async () => {
    setIsLoading(true);
    try {
      const data = await auditApi.getAuditLogs({
        page: currentPage,
        page_size: pageSize,
        user_email: userEmail || undefined,
        action: actionFilter || undefined,
        resource: resourceFilter || undefined,
        resource_id: resourceId || undefined,
      });
      setLogs(data.items);
      setTotalItems(data.total);
      setTotalPages(data.total_pages);
    } catch (err) {
      console.error('Failed to load audit trail', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [currentPage, actionFilter, resourceFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadAuditLogs();
  };

  const handleViewDiff = (log: AuditLog) => {
    setSelectedLog(log);
    setIsDiffOpen(true);
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('CREATE')) return 'success';
    if (action.includes('UPDATE') || action.includes('MODIFY')) return 'default';
    if (action.includes('DELETE') || action.includes('REJECT') || action.includes('CONFIRM_FRAUD')) return 'danger';
    if (action.includes('LOGIN') || action.includes('AUTH')) return 'secondary';
    return 'warning';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <ShieldCheck className="h-7 w-7 text-blue-500" />
            Immutable Regulatory Audit Trail
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete tamper-evident event stream recording all user investigations, rule modifications, and claim resolutions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-xs">
            <Lock className="h-3 w-3 mr-1" /> Append-Only Log Active
          </Badge>
          <Button variant="secondary" size="sm" onClick={loadAuditLogs} className="text-xs">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* Filter Card */}
      <Card className="border-slate-800 bg-slate-900/90 shadow-md">
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Filter by Actor Email..."
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                icon={<User className="h-4 w-4" />}
              />
            </div>
            <div className="flex-1">
              <Input
                placeholder="Filter by Resource ID (Claim ID, Rule ID)..."
                value={resourceId}
                onChange={(e) => setResourceId(e.target.value)}
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            <div className="flex gap-2.5">
              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-blue-500"
              >
                <option value="">All Actions</option>
                <option value="INVESTIGATION_DECISION">INVESTIGATION_DECISION</option>
                <option value="NOTE_ADDED">NOTE_ADDED</option>
                <option value="EVIDENCE_UPLOADED">EVIDENCE_UPLOADED</option>
                <option value="RULE_UPDATED">RULE_UPDATED</option>
                <option value="CLAIM_SCORED">CLAIM_SCORED</option>
                <option value="REPORT_GENERATED">REPORT_GENERATED</option>
                <option value="USER_LOGIN">USER_LOGIN</option>
              </select>

              <select
                value={resourceFilter}
                onChange={(e) => {
                  setResourceFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-blue-500"
              >
                <option value="">All Resources</option>
                <option value="INVESTIGATION">INVESTIGATION</option>
                <option value="CLAIM">CLAIM</option>
                <option value="FRAUD_RULE">FRAUD_RULE</option>
                <option value="USER">USER</option>
                <option value="REPORT">REPORT</option>
                <option value="SETTING">SETTING</option>
              </select>

              <Button type="submit" variant="secondary" size="md" className="text-xs">
                Filter
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card className="border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Actor / User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Resource ID</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead className="text-right">Payload / Diff</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-slate-400">
                  Loading immutable audit entries...
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-slate-400">
                  No audit log records matching the criteria.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-mono text-xs text-slate-300 whitespace-nowrap">
                    {formatDate(l.timestamp)}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-white max-w-[180px] truncate">
                    {l.user_email}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getActionBadgeVariant(l.action)}>
                      {l.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-slate-300">
                    {l.resource}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-blue-400 font-bold max-w-[160px] truncate">
                    {l.resource_id || '—'}
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-slate-400">
                    {l.ip_address}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDiff(l)}
                      className="text-xs text-blue-400 hover:text-blue-300 h-8"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      View Diff
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
          pageSize={pageSize}
          onPageChange={(p) => setCurrentPage(p)}
        />
      </Card>

      {/* Diff / Payload Inspection Modal */}
      <Modal
        isOpen={isDiffOpen}
        onClose={() => setIsDiffOpen(false)}
        title="Audit Event State Delta"
        description={`Audit record ID: ${selectedLog?.id}`}
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-4 pt-2">
            {/* Meta tags */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-500 block">User</span>
                <span className="text-white font-medium truncate block">{selectedLog.user_email}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Action</span>
                <span className="text-blue-400 font-bold block">{selectedLog.action}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Resource</span>
                <span className="text-slate-300 font-mono block">{selectedLog.resource} ({selectedLog.resource_id})</span>
              </div>
              <div>
                <span className="text-slate-500 block">IP / Session</span>
                <span className="text-slate-400 font-mono block">{selectedLog.ip_address}</span>
              </div>
            </div>

            {/* Before vs After Side-by-Side or JSON view */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5" /> Previous State
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-72">
                  <pre className="whitespace-pre-wrap">
                    {selectedLog.previous_value
                      ? JSON.stringify(selectedLog.previous_value, null, 2)
                      : '// No previous state (Creation / Initial state)'}
                  </pre>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <ArrowRight className="h-3.5 w-3.5" /> New State
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-72">
                  <pre className="whitespace-pre-wrap">
                    {selectedLog.new_value
                      ? JSON.stringify(selectedLog.new_value, null, 2)
                      : '// No state modification recorded'}
                  </pre>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <Button variant="secondary" onClick={() => setIsDiffOpen(false)}>
                Close Viewer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
