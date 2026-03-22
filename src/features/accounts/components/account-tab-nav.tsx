'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { tabMeta } from './tab-config';
import type { AccountBannerStats } from '../queries/get-account-banner-stats';

type Props = {
  accountId: string;
  stats: AccountBannerStats;
};

export function AccountTabNav({ accountId, stats }: Props) {
  const pathname = usePathname();
  const basePath = `/admin/accounts/${accountId}`;

  return (
    <nav className="flex items-center gap-1 rounded-xl border bg-card shadow-sm px-2 py-1.5">
      {tabMeta.map((tab) => {
        const Icon = tab.icon;
        const href = tab.key === 'overview' ? basePath : `${basePath}/${tab.key}`;
        const isActive = tab.key === 'overview'
          ? pathname === basePath
          : pathname === href;
        const count = tab.countKey ? stats[tab.countKey] : undefined;
        return (
          <Link
            key={tab.key}
            href={href}
            scroll={false}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary/10 text-primary-action'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
            {count != null && count > 0 && (
              <Badge className="bg-primary/15 text-primary-action border-0 text-[10px] h-4 px-1.5">{count}</Badge>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
