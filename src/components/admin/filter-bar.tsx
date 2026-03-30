import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type FilterBarProps = {
  children: ReactNode;
  className?: string;
};

export function FilterBar({ children, className }: FilterBarProps) {
  return <div className={cn('rounded-xl border bg-card p-3 shadow-sm', className)}>{children}</div>;
}
