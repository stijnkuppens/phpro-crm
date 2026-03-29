import type { LucideIcon } from 'lucide-react';
import { CardTitle } from '@/components/ui/card';

type SectionTitleProps = {
  icon?: LucideIcon;
  action?: React.ReactNode;
  children: React.ReactNode;
};

export function SectionTitle({ icon: Icon, action, children }: SectionTitleProps) {
  const title = (
    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      {children}
    </CardTitle>
  );

  if (!action) return title;

  return (
    <div className="flex items-center justify-between">
      {title}
      {action}
    </div>
  );
}
