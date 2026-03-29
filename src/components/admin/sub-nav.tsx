'use client';

import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
  const router = useRouter();

  const activeItem = items.find((i) => i.key === activeKey);

  /* ── Mobile: select dropdown ──────────────────────── */
  if (isMobile) {
    return (
      <Select
        value={activeKey}
        onValueChange={(val) => {
          if (getHref) {
            router.push(getHref(val as string));
          } else {
            onSelect?.(val as string);
          }
        }}
      >
        <SelectTrigger className="w-full rounded-xl border bg-card shadow-sm">
          {activeItem ? (
            <span className="flex items-center gap-2">
              {activeItem.icon && <activeItem.icon className="h-4 w-4" />}
              {activeItem.label}
              {activeItem.count != null && activeItem.count > 0 && (
                <Badge className="bg-primary/15 text-primary-action border-0 text-[10px] h-4 px-1.5">
                  {activeItem.count}
                </Badge>
              )}
            </span>
          ) : (
            'Selecteer...'
          )}
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.key} value={item.key}>
              <span className="flex items-center gap-2">
                {item.icon && <item.icon className="h-4 w-4" />}
                {item.label}
                {item.count != null && item.count > 0 && (
                  <span className="ml-auto text-[10px] text-muted-foreground">{item.count}</span>
                )}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  /* ── Desktop: horizontal tab pills ────────────────── */
  return (
    <nav className="flex items-center gap-1 rounded-xl border bg-card shadow-sm px-2 py-1.5">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeKey === item.key;
        const className = `inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
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
            <Link key={item.key} href={getHref(item.key)} scroll={false} className={className}>
              {content}
            </Link>
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
