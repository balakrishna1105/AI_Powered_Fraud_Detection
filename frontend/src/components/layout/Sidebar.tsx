import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FileSpreadsheet,
  SearchCode,
  Building2,
  Users2,
  FileBarChart,
  UserCheck,
  Sliders,
  ShieldCheck,
  History,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '../ui/Card';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  roles?: ('ADMIN' | 'INVESTIGATOR' | 'ANALYST')[];
}

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const userRole = user?.role || 'ANALYST';

  const mainNavItems: NavItem[] = [
    {
      to: '/admin/dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      to: '/claims',
      label: 'Claims',
      icon: <FileSpreadsheet className="h-4 w-4" />,
    },
    {
      to: '/investigations',
      label: 'Investigations',
      icon: <SearchCode className="h-4 w-4" />,
      badge: 'Active',
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
    {
      to: '/providers',
      label: 'Providers',
      icon: <Building2 className="h-4 w-4" />,
    },
    {
      to: '/members',
      label: 'Members',
      icon: <Users2 className="h-4 w-4" />,
    },
    {
      to: '/reports',
      label: 'Reports',
      icon: <FileBarChart className="h-4 w-4" />,
    },
  ];

  const adminNavItems: NavItem[] = [
    {
      to: '/admin/fraud-rules',
      label: 'Fraud Rules',
      icon: <Sliders className="h-4 w-4" />,
      roles: ['ADMIN'],
    },
    {
      to: '/admin/users',
      label: 'Users',
      icon: <UserCheck className="h-4 w-4" />,
      roles: ['ADMIN'],
    },
    {
      to: '/admin/audit-logs',
      label: 'Audit Logs',
      icon: <History className="h-4 w-4" />,
      roles: ['ADMIN', 'ANALYST'],
    },
    {
      to: '/admin/settings',
      label: 'Settings',
      icon: <ShieldCheck className="h-4 w-4" />,
      roles: ['ADMIN'],
    },
  ];

  const filterByRole = (item: NavItem) => {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  };

  return (
    <aside className="w-64 shrink-0 border-r border-slate-800 bg-slate-950 flex flex-col justify-between select-none">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800/80">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <ShieldAlert className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base text-white tracking-tight flex items-center gap-1.5">
              HealthGuard <span className="text-[10px] uppercase font-extrabold bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-md border border-blue-500/30">AI</span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">SIU Fraud Platform</p>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="px-3 py-4 space-y-6">
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Operations
            </div>
            <nav className="space-y-1">
              {mainNavItems.filter(filterByRole).map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group',
                      isActive
                        ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 font-semibold'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                    )
                  }
                >
                  <div className="flex items-center gap-3">
                    <span className="group-hover:text-blue-400 transition-colors">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={cn('text-[10px] font-bold px-1.5 py-0.2 rounded-full', item.badgeColor)}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          <div>
            <div className="px-3 mb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Governance & Admin
            </div>
            <nav className="space-y-1">
              {adminNavItems.filter(filterByRole).map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group',
                      isActive
                        ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 font-semibold'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                    )
                  }
                >
                  <div className="flex items-center gap-3">
                    <span className="group-hover:text-blue-400 transition-colors">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Model Version Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/40 m-3 rounded-xl border">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-[11px] font-semibold text-slate-200">Ensemble Scorer Active</p>
        </div>
        <p className="text-[10px] text-slate-400 mt-0.5">Model: Hybrid v2.4 (Rules + ML)</p>
      </div>
    </aside>
  );
};
