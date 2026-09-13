import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { providersApi } from '../api/providers';
import type { Provider } from '../types';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Pagination } from '../components/ui/Table';
import { formatINR } from '../utils/formatters';
import {
  Building2,
  Search,
  Eye
} from 'lucide-react';

export const Providers: React.FC = () => {
  const navigate = useNavigate();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(15);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [search, setSearch] = useState<string>('');
  const [state, setState] = useState<string>('');

  const loadProviders = async () => {
    setIsLoading(true);
    try {
      const data = await providersApi.getProviders({
        page: currentPage,
        page_size: pageSize,
        search: search || undefined,
        state: state || undefined,
      });
      setProviders(data.items);
      setTotalItems(data.total);
      setTotalPages(data.total_pages);
    } catch (err) {
      console.error('Failed to load providers', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProviders();
  }, [currentPage, state]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadProviders();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Building2 className="h-7 w-7 text-blue-500" />
            Healthcare Provider Risk Surveillance
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitor network hospitals, historical fraud rates, peer group anomalies, and suspicious claim volumes.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="border-slate-800 bg-slate-900/90 shadow-md">
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Input
                placeholder="Search hospital name, provider ID, city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            <select
              value={state}
              onChange={(e) => { setState(e.target.value); setCurrentPage(1); }}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-blue-500"
            >
              <option value="">All States</option>
              <option value="Telangana">Telangana</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Andhra Pradesh">Andhra Pradesh</option>
              <option value="Tamil Nadu">Tamil Nadu</option>
              <option value="Delhi NCR">Delhi NCR</option>
              <option value="Gujarat">Gujarat</option>
            </select>
          </form>
        </CardContent>
      </Card>

      {/* Providers Table */}
      <Card className="border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Provider ID</TableHead>
              <TableHead>Hospital / Clinic Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Risk Score</TableHead>
              <TableHead>Billed Claims</TableHead>
              <TableHead>Verified Fraud Count</TableHead>
              <TableHead>Fraud Rate (%)</TableHead>
              <TableHead>Avg Claim Size</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-10 text-slate-400">
                  Loading provider risk statistics...
                </TableCell>
              </TableRow>
            ) : providers.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono font-bold text-purple-400 whitespace-nowrap">
                  {p.id}
                </TableCell>
                <TableCell>
                  <span className="font-semibold text-slate-100">{p.name}</span>
                  <p className="text-[11px] text-slate-400">{p.provider_type}</p>
                </TableCell>
                <TableCell className="text-xs text-slate-300">
                  {p.city}, {p.state}
                </TableCell>
                <TableCell>
                  <span className={`font-mono font-bold text-xs ${
                    p.risk_score >= 70 ? 'text-rose-400' : p.risk_score >= 40 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {p.risk_score}/100
                  </span>
                </TableCell>
                <TableCell className="font-mono text-xs text-slate-200">
                  {p.historical_claims_count}
                </TableCell>
                <TableCell className="font-mono text-xs text-rose-400 font-semibold">
                  {p.historical_fraud_count}
                </TableCell>
                <TableCell>
                  <span className={`font-mono font-bold text-xs ${
                    p.historical_fraud_rate > 10 ? 'text-rose-400' : 'text-slate-300'
                  }`}>
                    {p.historical_fraud_rate}%
                  </span>
                </TableCell>
                <TableCell className="font-mono text-xs text-slate-200">
                  {formatINR(p.avg_claim_amount)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/providers/${p.id}`)}
                    className="text-xs h-8"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    Analytics
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
