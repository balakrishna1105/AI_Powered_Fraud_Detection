import React from 'react';
import { cn } from './Card';
import type { RiskLevel } from '../../types';
import { getRiskLevelDetails } from '../../utils/formatters';
import { ShieldAlert, ShieldCheck, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'danger' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = 'default', size = 'md', children, ...props }) => {
  const variants = {
    default: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    secondary: 'bg-slate-800 text-slate-300 border-slate-700',
    outline: 'border-slate-700 text-slate-300',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    danger: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    info: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.2 text-[10px]',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border font-semibold tracking-wide transition-colors',
        variants[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export interface RiskBadgeProps {
  level?: RiskLevel | string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  showIcon = true,
  size = 'md',
  className,
}) => {
  const details = getRiskLevelDetails(level);

  const getIcon = () => {
    switch (level?.toUpperCase()) {
      case 'CRITICAL':
        return <ShieldAlert className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />;
      case 'HIGH':
        return <AlertTriangle className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />;
      case 'MEDIUM':
        return <AlertCircle className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />;
      case 'LOW':
        return <Info className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />;
      case 'NORMAL':
      default:
        return <ShieldCheck className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />;
    }
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm font-bold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-semibold shadow-xs',
        details.badgeClass,
        sizeStyles[size],
        className
      )}
      title={`Risk Level: ${details.label}`}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full animate-pulse', details.dotColor)} />
      {showIcon && getIcon()}
      <span>{details.label}</span>
    </span>
  );
};
