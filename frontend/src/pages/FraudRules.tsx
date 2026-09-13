import React, { useState, useEffect } from 'react';
import { fraudRulesApi } from '../api/fraudRules';
import type { FraudRule, FraudCategory, RuleSeverity } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { getFraudCategoryLabel } from '../utils/formatters';
import {
  Sliders,
  PlusCircle,
  Edit2,
  Trash2,
} from 'lucide-react';

export const FraudRules: React.FC = () => {
  const [rules, setRules] = useState<FraudRule[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedRule, setSelectedRule] = useState<FraudRule | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Create form state
  const [ruleForm, setRuleForm] = useState({
    name: '',
    description: '',
    category: 'BILLING_FRAUD' as FraudCategory,
    severity: 'HIGH' as RuleSeverity,
    threshold: 200000,
    rule_type: 'THRESHOLD',
  });

  const loadRules = async () => {
    setIsLoading(true);
    try {
      const data = await fraudRulesApi.getAllRules();
      setRules(data);
    } catch (err) {
      console.error('Failed to load fraud rules', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleToggle = async (ruleId: string, currentActive: boolean) => {
    try {
      const updated = await fraudRulesApi.toggleRule(ruleId, !currentActive);
      setRules((prev) => prev.map((r) => (r.id === ruleId ? updated : r)));
    } catch (err: any) {
      alert(err.message || 'Failed to toggle rule');
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fraudRulesApi.createRule(ruleForm);
      setIsCreateModalOpen(false);
      setRuleForm({
        name: '',
        description: '',
        category: 'BILLING_FRAUD',
        severity: 'HIGH',
        threshold: 200000,
        rule_type: 'THRESHOLD',
      });
      loadRules();
    } catch (err: any) {
      alert(err.message || 'Failed to create rule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRule) return;
    setIsSubmitting(true);
    try {
      await fraudRulesApi.updateRule(selectedRule.id, {
        name: selectedRule.name,
        description: selectedRule.description,
        category: selectedRule.category,
        severity: selectedRule.severity,
        threshold: selectedRule.threshold,
      });
      setIsEditModalOpen(false);
      loadRules();
    } catch (err: any) {
      alert(err.message || 'Failed to update rule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this fraud rule?')) return;
    try {
      await fraudRulesApi.deleteRule(ruleId);
      loadRules();
    } catch (err: any) {
      alert(err.message || 'Failed to delete rule');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Sliders className="h-7 w-7 text-blue-500" />
            Configurable Fraud Rules Engine
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Define, calibrate, enable/disable, and version deterministic clinical fraud detection rules.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="text-xs"
          >
            <PlusCircle className="h-4 w-4 mr-1.5" />
            Add Custom Rule
          </Button>
        </div>
      </div>

      {/* Rules Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-800 bg-slate-900/90 p-4">
          <span className="text-xs text-slate-400 font-semibold uppercase">Total Configured Rules</span>
          <p className="text-2xl font-bold font-mono text-white mt-1">{rules.length}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Deterministic clinical logic</span>
        </Card>
        <Card className="border-slate-800 bg-slate-900/90 p-4">
          <span className="text-xs text-emerald-400 font-semibold uppercase">Active In Pipeline</span>
          <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {rules.filter((r) => r.is_active).length}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Real-time surveillance enforcement</span>
        </Card>
        <Card className="border-slate-800 bg-slate-900/90 p-4">
          <span className="text-xs text-blue-400 font-semibold uppercase">Engine Strategy</span>
          <p className="text-base font-bold text-slate-100 mt-2">Rules + ML Hybrid</p>
          <span className="text-[11px] text-slate-400 block">Cascades penalties to ensemble weights</span>
        </Card>
      </div>

      {/* Fraud Rules Table */}
      <Card className="border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rule ID</TableHead>
              <TableHead>Rule Name & Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Threshold</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-slate-400">
                  Loading configured rules...
                </TableCell>
              </TableRow>
            ) : (
              rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-mono font-bold text-amber-400 whitespace-nowrap">
                    {rule.id}
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-slate-100">{rule.name}</div>
                    <p className="text-[11px] text-slate-400 max-w-md mt-0.5">{rule.description}</p>
                  </TableCell>
                  <TableCell className="text-xs text-slate-300 whitespace-nowrap">
                    {getFraudCategoryLabel(rule.category)}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      rule.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                      rule.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' :
                      'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      {rule.severity}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-200">
                    {rule.threshold.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-400">
                    v{rule.version}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleToggle(rule.id, rule.is_active)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        rule.is_active ? 'bg-emerald-600' : 'bg-slate-700'
                      }`}
                      title={rule.is_active ? 'Rule is active' : 'Rule is disabled'}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          rule.is_active ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedRule(rule);
                        setIsEditModalOpen(true);
                      }}
                      className="h-7 w-7 text-slate-400 hover:text-blue-400"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRule(rule.id)}
                      className="h-7 w-7 text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create Rule Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Fraud Detection Rule"
        description="Configure a new deterministic rule threshold for automated claim screening."
      >
        <form onSubmit={handleCreateRule} className="space-y-4 text-xs">
          <Input
            label="Rule Name"
            required
            value={ruleForm.name}
            onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
            placeholder="e.g. Unbundled Diagnostic Scans Threshold"
          />

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Rule Description</label>
            <textarea
              required
              rows={3}
              value={ruleForm.description}
              onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
              placeholder="Describe trigger condition and clinical reasoning..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">Fraud Category</label>
              <Select
                value={ruleForm.category}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRuleForm({ ...ruleForm, category: e.target.value as FraudCategory })}
              >
                <option value="BILLING_FRAUD">Billing Fraud</option>
                <option value="DUPLICATE_CLAIM">Duplicate Claim</option>
                <option value="UPCODING">Upcoding</option>
                <option value="PROVIDER_FRAUD">Provider Collusion</option>
                <option value="UNNECESSARY_HOSPITALIZATION">Unnecessary Hospitalization</option>
                <option value="PHANTOM_SERVICES">Phantom Services</option>
              </Select>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">Severity</label>
              <Select
                value={ruleForm.severity}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRuleForm({ ...ruleForm, severity: e.target.value as RuleSeverity })}
              >
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </Select>
            </div>
          </div>

          <Input
            label="Trigger Threshold Value"
            type="number"
            required
            value={ruleForm.threshold}
            onChange={(e) => setRuleForm({ ...ruleForm, threshold: Number(e.target.value) })}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Create Rule
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Rule Modal */}
      {selectedRule && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Rule ${selectedRule.id}`}
          description="Adjust severity, description, or threshold parameters."
        >
          <form onSubmit={handleUpdateRule} className="space-y-4 text-xs">
            <Input
              label="Rule Name"
              required
              value={selectedRule.name}
              onChange={(e) => setSelectedRule({ ...selectedRule, name: e.target.value })}
            />

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Description</label>
              <textarea
                required
                rows={3}
                value={selectedRule.description}
                onChange={(e) => setSelectedRule({ ...selectedRule, description: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">Severity</label>
                <Select
                  value={selectedRule.severity}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedRule({ ...selectedRule, severity: e.target.value as RuleSeverity })}
                >
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </Select>
              </div>

              <Input
                label="Threshold Value"
                type="number"
                required
                value={selectedRule.threshold}
                onChange={(e) => setSelectedRule({ ...selectedRule, threshold: Number(e.target.value) })}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Save Changes (v{parseFloat(selectedRule.version || '1.0') + 0.1})
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
