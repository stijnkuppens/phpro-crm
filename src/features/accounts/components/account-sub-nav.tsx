'use client';

import { usePathname } from 'next/navigation';
import { SubNav, type SubNavItem } from '@/components/admin/sub-nav';
import { tabMeta } from './tab-config';
import type { AccountBannerStats } from '../queries/get-account-banner-stats';

type Props = {
  accountId: string;
  stats: AccountBannerStats;
};

export function AccountSubNav({ accountId, stats }: Props) {
  const pathname = usePathname();
  const basePath = `/admin/accounts/${accountId}`;

  const items: SubNavItem[] = tabMeta.map((tab) => ({
    key: tab.key,
    label: tab.label,
    icon: tab.icon,
    count: tab.countKey ? stats[tab.countKey] : undefined,
  }));

  const activeKey = tabMeta.find((tab) => {
    const href = tab.key === 'overview' ? basePath : `${basePath}/${tab.key}`;
    return pathname === href;
  })?.key ?? 'overview';

  return (
    <SubNav
      items={items}
      activeKey={activeKey}
      getHref={(key) => key === 'overview' ? basePath : `${basePath}/${key}`}
    />
  );
}
