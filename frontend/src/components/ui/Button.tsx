import React from 'react';
import { cn } from './Card';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'outline' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, disabled, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer';

    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-600/20 active:bg-blue-700',
      secondary: 'bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700 active:bg-slate-850',
      danger: 'bg-rose-600 text-white hover:bg-rose-500 shadow-md shadow-rose-600/20 active:bg-rose-700',
      warning: 'bg-amber-600 text-white hover:bg-amber-500 shadow-md shadow-amber-600/20 active:bg-amber-700',
      success: 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/20 active:bg-emerald-700',
      outline: 'border border-slate-700 bg-transparent hover:bg-slate-800 text-slate-200 active:bg-slate-750',
      ghost: 'bg-transparent hover:bg-slate-800 text-slate-300 hover:text-slate-100',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-9 px-4 text-sm',
      lg: 'h-11 px-6 text-base',
      icon: 'h-9 w-9 p-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-current" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
