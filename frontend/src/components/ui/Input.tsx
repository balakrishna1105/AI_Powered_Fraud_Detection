import React from 'react';
import { cn } from './Card';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, type = 'text', ...props }, ref) => (
    <div className="w-full space-y-1.5">
      {label && <label className="block text-xs font-medium text-slate-300">{label}</label>}
      <div className="relative flex items-center">
        {icon && <div className="absolute left-3 text-slate-400 pointer-events-none">{icon}</div>}
        <input
          type={type}
          ref={ref}
          className={cn(
            'w-full rounded-lg border border-slate-750 bg-slate-950/60 px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 shadow-inner transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50',
            icon ? 'pl-9' : undefined,
            error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : undefined,
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, children, ...props }, ref) => (
    <div className="w-full space-y-1.5">
      {label && <label className="block text-xs font-medium text-slate-300">{label}</label>}
      <select
        ref={ref}
        className={cn(
          'w-full rounded-lg border border-slate-750 bg-slate-950/80 px-3.5 py-2 text-sm text-slate-100 shadow-inner transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer',
          error && 'border-rose-500',
          className
        )}
        {...props}
      >
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-100">
                {opt.label}
              </option>
            ))
          : children}
      </select>
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  )
);
Select.displayName = 'Select';
