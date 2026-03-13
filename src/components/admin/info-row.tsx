import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type InfoRowProps = {
  label: string;
  value?: React.ReactNode;
  icon?: LucideIcon;
  href?: string;
  mono?: boolean;
};

export function InfoRow({ label, value, icon: Icon, href, mono }: InfoRowProps) {
  return (
    <div className="flex items-start gap-2.5 border-b border-muted/50 py-2 last:border-0">
      {Icon && <Icon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />}
      <span className="w-28 flex-shrink-0 text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <span className={cn('min-w-0 flex-1 text-sm', mono && 'font-mono text-xs')}>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-primary hover:underline"
          >
            {value}
          </a>
        ) : (
          value ?? <span className="text-muted-foreground/40">—</span>
        )}
      </span>
    </div>
  );
}
