import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { membersApi } from '../api/providers';
import type { Member } from '../types';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Pagination } from '../components/ui/Table';
import { formatINR } from '../utils/formatters';
import {
  Users2,
  Search,
  Eye,
} from 'lucide-react';

export const Members: React.FC = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(15);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  const loadMembers = async () => {
    setIsLoading(true);
    try {
      const data = await membersApi.getMembers({
        page: currentPage,
        page_size: pageSize,
        search: search || undefined,
      });
      setMembers(data.items);
      setTotalItems(data.total);
      setTotalPages(data.total_pages);
    } catch (err) {
      console.error('Failed to load members', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [currentPage]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadMembers();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Users2 className="h-7 w-7 text-blue-500" />
            Member Risk & Policyholder Analysis
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Detect policyholder hopping, multiple simultaneous admissions, and high frequency claim anomalies.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="border-slate-800 bg-slate-900/90 shadow-md">
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-3">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search member name, ID, policy number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            <Button type="submit" variant="secondary" size="md" className="text-xs">
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card className="border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member ID</TableHead>
              <TableHead>Full Name</TableHead>
              <TableHead>Policy Number</TableHead>
              <TableHead>Policy Plan Tier</TableHead>
              <TableHead>Demographics</TableHead>
              <TableHead>Risk Score</TableHead>
              <TableHead>Claims Count</TableHead>
              <TableHead>Total Claimed Value</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-10 text-slate-400">
                  Loading policyholder profiles...
                </TableCell>
              </TableRow>
            ) : members.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-mono font-bold text-blue-400 whitespace-nowrap">
                  {m.id}
                </TableCell>
                <TableCell className="font-semibold text-slate-100">
                  {m.first_name} {m.last_name}
                </TableCell>
                <TableCell className="font-mono text-xs text-slate-300">
                  {m.policy_number}
                </TableCell>
                <TableCell className="text-xs text-slate-300 truncate max-w-[180px]">
                  {m.policy_tier}
                </TableCell>
                <TableCell className="text-xs text-slate-400">
                  {m.age} yrs · {m.gender} ({m.city}, {m.state})
                </TableCell>
                <TableCell>
                  <span className={`font-mono font-bold text-xs ${
                    m.risk_score >= 70 ? 'text-rose-400' : m.risk_score >= 40 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {m.risk_score}/100
                  </span>
                </TableCell>
                <TableCell className="font-mono text-xs text-slate-200">
                  {m.claims_count}
                </TableCell>
                <TableCell className="font-mono font-bold text-xs text-slate-100">
                  {formatINR(m.total_claim_value)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/members/${m.id}`)}
                    className="text-xs h-8"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    Profile
                  </Button>
                </TableCell>
              </TableRow>
            ))}
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
