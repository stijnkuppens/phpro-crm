import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type SectionCardProps = {
  title: string;
  icon?: LucideIcon;
  iconClassName?: string;
  children: React.ReactNode;
  className?: string;
};

export function SectionCard({ title, icon: Icon, iconClassName, children, className }: SectionCardProps) {
  return (
    <div className={cn('overflow-hidden rounded-xl border', className)}>
      <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
        {Icon && <Icon className={cn('h-3.5 w-3.5', iconClassName)} />}
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </span>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}
