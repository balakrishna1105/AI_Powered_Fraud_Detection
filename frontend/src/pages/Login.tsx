import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ShieldAlert, Lock, Mail, ShieldCheck, UserCheck, BarChart3, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState<string>('admin@healthguard.ai');
  const [password, setPassword] = useState<string>('Admin@123');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/admin/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const setDemoRole = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Decorative Gradients */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-rose-600 flex items-center justify-center shadow-xl shadow-blue-500/20 border border-blue-400/30">
            <ShieldAlert className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            HealthGuard <span className="text-blue-500">AI</span>
          </h1>
          <p className="text-xs text-slate-400 max-w-xs">
            Enterprise Health Insurance Fraud Detection & Special Investigation Platform
          </p>
        </div>

        {/* Login Form Card */}
        <Card className="border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg text-slate-100">Sign in to your account</CardTitle>
            <CardDescription>Enter your enterprise credentials to access the console</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@healthguard.ai"
                icon={<Mail className="h-4 w-4" />}
              />

              <Input
                label="Password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                icon={<Lock className="h-4 w-4" />}
              />

              <Button type="submit" variant="primary" className="w-full h-10 font-semibold" isLoading={isLoading}>
                Authenticate Session
              </Button>
            </form>

            {/* Role Quick Selector for Demo */}
            <div className="pt-3 border-t border-slate-800/80 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">
                Demo Quick-Fill Roles
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDemoRole('admin@healthguard.ai', 'Admin@123')}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-left cursor-pointer group"
                >
                  <ShieldCheck className="h-4 w-4 text-blue-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-bold text-slate-200">Admin</span>
                  <span className="text-[9px] text-slate-400">Full System</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDemoRole('investigator@healthguard.ai', 'Invest@123')}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-left cursor-pointer group"
                >
                  <UserCheck className="h-4 w-4 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-bold text-slate-200">Investigator</span>
                  <span className="text-[9px] text-slate-400">SIU Queue</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDemoRole('analyst@healthguard.ai', 'Analyst@123')}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-left cursor-pointer group"
                >
                  <BarChart3 className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-bold text-slate-200">Analyst</span>
                  <span className="text-[9px] text-slate-400">Reporting</span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <p className="text-center text-[11px] text-slate-400">
          Protected by AES-256 JWT encryption & role-based access audit logs.
        </p>
      </div>
    </div>
  );
};
