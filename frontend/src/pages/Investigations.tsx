import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { investigationsApi } from '../api/investigations';
import type { Investigation, InvestigationStatus } from '../types';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Tabs } from '../components/ui/Tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Pagination } from '../components/ui/Table';
import { RiskBadge } from '../components/ui/Badge';
import {
  formatINR,
  getInvestigationStatusBadge,
} from '../utils/formatters';
import {
  SearchCode,
  Search,
  Eye,
  UserCheck,
} from 'lucide-react';

export const Investigations: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(Number(searchParams.get('page')) || 1);
  const [pageSize] = useState<number>(15);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [activeTab, setActiveTab] = useState<string>(searchParams.get('status') || 'ALL');
  const [search, setSearch] = useState<string>(searchParams.get('search') || '');

  const statusTabs = [
    { id: 'ALL', label: 'All Cases' },
    { id: 'NEW', label: 'New Alerts' },
    { id: 'ASSIGNED', label: 'Assigned' },
    { id: 'UNDER_REVIEW', label: 'Under Review' },
    { id: 'INFORMATION_REQUIRED', label: 'Info Required' },
    { id: 'ESCALATED', label: 'Escalated' },
    { id: 'CONFIRMED_FRAUD', label: 'Confirmed Fraud' },
    { id: 'FALSE_POSITIVE', label: 'False Positives' },
    { id: 'CLOSED', label: 'Closed' },
  ];

  const loadInvestigations = async () => {
    setIsLoading(true);
    try {
      const data = await investigationsApi.getInvestigations({
        page: currentPage,
        page_size: pageSize,
        status: activeTab === 'ALL' ? undefined : (activeTab as InvestigationStatus),
        search: search || undefined,
      });
      setInvestigations(data.items);
      setTotalItems(data.total);
      setTotalPages(data.total_pages);
    } catch (err) {
      console.error('Failed to load investigations', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvestigations();
  }, [currentPage, activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadInvestigations();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <SearchCode className="h-7 w-7 text-blue-500" />
            Special Investigation Unit (SIU) Queue
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Investigate flagged health claims, manage evidence, record clinical findings, and enforce decisions.
          </p>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="space-y-4">
        <Tabs
          tabs={statusTabs}
          activeTab={activeTab}
          onChange={(tabId) => {
            setActiveTab(tabId);
            setCurrentPage(1);
          }}
        />

        <Card className="border-slate-800 bg-slate-900/90 shadow-md">
          <CardContent className="p-3.5 flex items-center justify-between gap-4">
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
              <Input
                placeholder="Search Investigation ID, Claim, Hospital, Patient..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search className="h-4 w-4" />}
              />
            </form>
            <div className="text-xs text-slate-400">
              Total <span className="font-bold text-slate-200">{totalItems}</span> cases in view
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Investigations Table */}
      <Card className="border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Case ID</TableHead>
              <TableHead>Claim Ref</TableHead>
              <TableHead>Member</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Claim Amount</TableHead>
              <TableHead>Risk Score</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Investigator</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-12 text-slate-400">
                  Loading investigation cases...
                </TableCell>
              </TableRow>
            ) : investigations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-12 text-slate-400">
                  No investigation cases found for the selected status.
                </TableCell>
              </TableRow>
            ) : (
              investigations.map((inv) => {
                const statusBadge = getInvestigationStatusBadge(inv.status);
                return (
                  <TableRow key={inv.id}>
                    {/* Investigation Case ID */}
                    <TableCell className="font-mono font-bold text-amber-400 whitespace-nowrap">
                      {inv.id}
                    </TableCell>

                    {/* Claim ID */}
                    <TableCell className="font-mono font-semibold text-blue-400 whitespace-nowrap">
                      {inv.claim_id}
                    </TableCell>
                    {/* Member */}
                    <TableCell>
                      <div className="font-medium text-slate-200">{inv.member_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{inv.member_id}</div>
                    </TableCell>
                    {/* Provider */}
                    <TableCell>
                      <div className="font-medium text-slate-200 truncate max-w-[170px]" title={inv.provider_name}>
                        {inv.provider_name}
                      </div>
                    </TableCell>
                    {/* Amount */}
                    <TableCell className="font-mono font-bold text-slate-100 whitespace-nowrap">
                      {formatINR(inv.claim_amount || 0)}
                    </TableCell>
                    {/* Risk Score */}
                    <TableCell>
                      <span className="font-mono font-bold text-xs text-rose-400">
                        {inv.fraud_score?.toFixed(0) || '0'}/100
                      </span>
                    </TableCell>
                    {/* Priority */}
                    <TableCell>
                      <RiskBadge level={inv.priority} size="sm" />
                    </TableCell>
                    {/* Investigator */}
                    <TableCell>
                      {inv.investigator_name ? (
                        <div className="flex items-center gap-1.5 text-xs text-slate-200">
                          <UserCheck className="h-3.5 w-3.5 text-blue-400" />
                          <span>{inv.investigator_name}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Unassigned</span>
                      )}
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
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/investigations/${inv.id}`)}
                        className="text-xs h-8"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        SIU Workbench
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
    </div>
  );
};
