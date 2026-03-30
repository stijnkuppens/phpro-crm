'use client';

import { Database, Settings, UserCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { SubNav, type SubNavItem } from '@/components/admin/sub-nav';

const tabs: SubNavItem[] = [
  { key: 'general', label: 'Algemeen', icon: Settings },
  { key: 'reference-data', label: 'Referentiedata', icon: Database },
  { key: 'account', label: 'Mijn Account', icon: UserCircle },
];

function getHref(key: string) {
  if (key === 'general') return '/admin/settings';
  return `/admin/settings/${key}`;
}

export function SettingsSubNav() {
  const pathname = usePathname();

  const activeKey =
    tabs.find((tab) => {
      const href = getHref(tab.key);
      return href === '/admin/settings' ? pathname === href : pathname.startsWith(href);
    })?.key ?? 'general';

  return <SubNav items={tabs} activeKey={activeKey} getHref={getHref} />;
}
