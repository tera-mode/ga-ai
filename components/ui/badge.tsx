import * as React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variantClasses = {
    default: 'bg-zinc-800 text-zinc-300',
    success: 'bg-emerald-950 text-emerald-400 border border-emerald-800',
    warning: 'bg-amber-950 text-amber-400 border border-amber-800',
    destructive: 'bg-red-950 text-red-400 border border-red-800',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
