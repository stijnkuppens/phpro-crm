import { formatEUR } from '@/lib/format';

type DiffBadgeProps = {
  value: number;
  format?: 'number' | 'currency';
  className?: string;
};

export function DiffBadge({ value, format = 'number', className }: DiffBadgeProps) {
  if (value === 0) return null;

  const colorClass = value > 0 ? 'text-green-600' : 'text-red-600';
  const prefix = value > 0 ? '+' : '';
  const formatted = format === 'currency' ? formatEUR(value) : String(value);

  return (
    <span className={`font-medium ${colorClass} ${className ?? ''}`.trim()}>
      {prefix}
      {formatted}
    </span>
  );
}
