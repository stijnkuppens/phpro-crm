'use client';

import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type SubNavItem = {
  key: string;
  label: string;
  icon?: LucideIcon;
  count?: number;
};

type Props = {
  items: SubNavItem[];
  activeKey: string;
  onSelect?: (key: string) => void;
  /** When provided, items render as <a> links instead of buttons */
  getHref?: (key: string) => string;
};

export function SubNav({ items, activeKey, onSelect, getHref }: Props) {
  return (
    <nav className="flex items-center gap-1 rounded-xl border bg-card shadow-sm px-2 py-1.5">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeKey === item.key;
        const className = `inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-primary/10 text-primary-action'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
        }`;

        const content = (
          <>
            {Icon && <Icon className="h-4 w-4" />}
            {item.label}
            {item.count != null && item.count > 0 && (
              <Badge className="bg-primary/15 text-primary-action border-0 text-[10px] h-4 px-1.5">{item.count}</Badge>
            )}
          </>
        );

        if (getHref) {
          return (
            <a key={item.key} href={getHref(item.key)} className={className}>
              {content}
            </a>
          );
        }

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelect?.(item.key)}
            className={className}
          >
            {content}
          </button>
        );
      })}
    </nav>
  );
}
