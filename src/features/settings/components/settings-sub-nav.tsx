'use client';

import { Database, UserCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { SubNav, type SubNavItem } from '@/components/admin/sub-nav';

const tabs: SubNavItem[] = [
  { key: 'reference-data', label: 'Referentiedata', icon: Database },
  { key: 'account', label: 'Mijn Account', icon: UserCircle },
];

function getHref(key: string) {
  return `/admin/settings/${key}`;
}

export function SettingsSubNav() {
  const pathname = usePathname();

  const activeKey =
    tabs.find((tab) => pathname.startsWith(getHref(tab.key)))?.key ?? 'reference-data';

  return <SubNav items={tabs} activeKey={activeKey} getHref={getHref} />;
}
