import { cn } from '@/lib/utils';

type StatusBadgeProps = {
  children: React.ReactNode;
  colorMap?: Record<string, string>;
  value?: string;
  positive?: boolean;
  className?: string;
};

const BASE = 'inline-flex w-fit items-center rounded-full border-0 px-2 py-0.5 text-xs font-medium';

export function StatusBadge({ children, colorMap, value, positive, className }: StatusBadgeProps) {
  let colorClass: string;

  if (colorMap && value != null) {
    colorClass = colorMap[value] ?? 'bg-muted text-muted-foreground';
  } else if (positive != null) {
    colorClass = positive
      ? 'bg-primary/15 text-primary-action'
      : 'bg-muted text-muted-foreground';
  } else {
    colorClass = 'bg-muted text-muted-foreground';
  }

  return (
    <span className={cn(BASE, colorClass, className)}>
      {children}
    </span>
  );
}
