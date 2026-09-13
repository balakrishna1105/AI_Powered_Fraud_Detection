import React, { useState, useEffect } from 'react';
import { auditApi } from '../api/audit';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Settings as SettingsIcon,
  Sliders,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Save,
  Zap,
  Info
} from 'lucide-react';

export const Settings: React.FC = () => {
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Editable settings map
  const [formValues, setFormValues] = useState<Record<string, string>>({
    critical_risk_threshold: '80',
    high_risk_threshold: '60',
    medium_risk_threshold: '30',
    auto_create_investigation: 'true',
    high_value_claim_threshold: '500000',
    duplicate_window_days: '30',
    ml_ensemble_weight: '0.65',
  });

  const loadSettings = async () => {
    try {
      const data = await auditApi.getSettings();
      const initialMap: Record<string, string> = { ...formValues };
      data.forEach((s) => {
        initialMap[s.key] = s.value;
      });
      setFormValues(initialMap);
    } catch (err) {
      console.error('Failed to load settings', err);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveAll = async () => {
    setIsSaving(true);
    setActionError(null);
    try {
      for (const [key, value] of Object.entries(formValues)) {
        await auditApi.updateSetting(key, value, `System parameter updated by admin`);
      }
      setActionSuccess('System configuration and fraud engine parameters updated successfully');
      setTimeout(() => setActionSuccess(null), 4000);
      loadSettings();
    } catch (err: any) {
      setActionError(err.message || 'Failed to save system settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <SettingsIcon className="h-7 w-7 text-blue-500" />
            System Configuration & Detection Thresholds
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Calibrate scoring engine thresholds, automated investigation triggers, and ML feature weights.
          </p>
        </div>
        <Button
          onClick={handleSaveAll}
          isLoading={isSaving}
          className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs"
        >
          <Save className="h-4 w-4 mr-2" />
          Save All Parameters
        </Button>
      </div>

      {/* Success Notification */}
      {actionSuccess && (
        <div className="bg-emerald-950/60 border border-emerald-600/50 text-emerald-300 px-4 py-3 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          {actionSuccess}
        </div>
      )}

      {/* Error Notification */}
      {actionError && (
        <div className="bg-rose-950/60 border border-rose-600/50 text-rose-300 px-4 py-3 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          {actionError}
        </div>
      )}

      {/* Grid: Risk Thresholds & ML Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Thresholds Card */}
        <Card className="border-slate-800 bg-slate-900 shadow-xl">
          <CardHeader className="border-b border-slate-800/80 pb-3">
            <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
              <Sliders className="h-4.5 w-4.5 text-blue-400" />
              Risk Classification Thresholds
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-5">
            {/* Critical Risk */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-500"></span> Critical Risk Score Cutoff
                </label>
                <span className="font-mono text-xs text-rose-400 font-bold">
                  {formValues.critical_risk_threshold} / 100
                </span>
              </div>
              <input
                type="range"
                min="70"
                max="95"
                step="1"
                value={formValues.critical_risk_threshold}
                onChange={(e) => setFormValues({ ...formValues, critical_risk_threshold: e.target.value })}
                className="w-full accent-rose-500 bg-slate-800 rounded-lg cursor-pointer"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Claims at or above this score are flagged for mandatory immediate investigation lock.
              </p>
            </div>

            {/* High Risk */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-orange-400 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-orange-500"></span> High Risk Score Cutoff
                </label>
                <span className="font-mono text-xs text-orange-400 font-bold">
                  {formValues.high_risk_threshold} / 100
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="75"
                step="1"
                value={formValues.high_risk_threshold}
                onChange={(e) => setFormValues({ ...formValues, high_risk_threshold: e.target.value })}
                className="w-full accent-orange-500 bg-slate-800 rounded-lg cursor-pointer"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Routed to the SIU Queue for senior investigator review.
              </p>
            </div>

            {/* Medium Risk */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500"></span> Medium Risk Score Cutoff
                </label>
                <span className="font-mono text-xs text-amber-400 font-bold">
                  {formValues.medium_risk_threshold} / 100
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="45"
                step="1"
                value={formValues.medium_risk_threshold}
                onChange={(e) => setFormValues({ ...formValues, medium_risk_threshold: e.target.value })}
                className="w-full accent-amber-500 bg-slate-800 rounded-lg cursor-pointer"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Requires pre-approval checklist confirmation.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Operational & SIU Automation Triggers */}
        <Card className="border-slate-800 bg-slate-900 shadow-xl">
          <CardHeader className="border-b border-slate-800/80 pb-3">
            <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
              <Zap className="h-4.5 w-4.5 text-amber-400" />
              Automated SIU Triggers & Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">
                Auto-Create Investigation on Critical Score
              </label>
              <select
                value={formValues.auto_create_investigation}
                onChange={(e) => setFormValues({ ...formValues, auto_create_investigation: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-blue-500"
              >
                <option value="true">Enabled (Automatically assign case to SIU Pool)</option>
                <option value="false">Disabled (Manual triage required)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">
                High-Value Claim Threshold (INR ₹)
              </label>
              <Input
                type="number"
                value={formValues.high_value_claim_threshold}
                onChange={(e) => setFormValues({ ...formValues, high_value_claim_threshold: e.target.value })}
                placeholder="500000"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Claims above ₹5,00,000 receive mandatory statistical outlier review.
              </span>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">
                Duplicate Claim Search Window (Days)
              </label>
              <Input
                type="number"
                value={formValues.duplicate_window_days}
                onChange={(e) => setFormValues({ ...formValues, duplicate_window_days: e.target.value })}
                placeholder="30"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Lookback window for identical diagnosis & date overlap detection.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ML Model Architecture & Info */}
      <Card className="border-slate-800 bg-slate-900 shadow-xl">
        <CardHeader className="border-b border-slate-800/80 pb-3">
          <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
            <Cpu className="h-4.5 w-4.5 text-purple-400" />
            AI & Machine Learning Engine Architecture
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 font-medium">Model Pipeline</span>
              <h4 className="text-sm font-bold text-white">Hybrid Ensemble v2.4</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Gradient Boosting Classifier + 6 Deterministic Clinical Rule Parsers.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 font-medium">Explainability Method</span>
              <h4 className="text-sm font-bold text-emerald-400">SHAP-Style Factor Attribution</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Generates calibrated risk contributions, feature weights, and human-readable rationale.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 font-medium">Engine Latency</span>
              <h4 className="text-sm font-bold text-blue-400">&lt; 25 ms / claim</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Real-time sub-second inference and fraud probability calibration.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pre-Seeded Demonstration Credentials */}
      <Card className="border-blue-900/50 bg-blue-950/20 shadow-xl">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-white">Role-Based Testing Credentials</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                You can switch accounts anytime by logging out and signing in with any of the following accounts:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800 text-xs">
                  <strong className="text-purple-400 block">ADMIN</strong>
                  <span className="text-slate-300 font-mono block">admin@healthguard.ai</span>
                  <span className="text-slate-400 font-mono block">Admin@123</span>
                </div>
                <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800 text-xs">
                  <strong className="text-blue-400 block">INVESTIGATOR</strong>
                  <span className="text-slate-300 font-mono block">investigator@healthguard.ai</span>
                  <span className="text-slate-400 font-mono block">Invest@123</span>
                </div>
                <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800 text-xs">
                  <strong className="text-emerald-400 block">ANALYST</strong>
                  <span className="text-slate-300 font-mono block">analyst@healthguard.ai</span>
                  <span className="text-slate-400 font-mono block">Analyst@123</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
