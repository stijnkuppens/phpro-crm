'use client';

import { SubNav, type SubNavItem } from '@/components/admin/sub-nav';

type ListPageToolbarProps = {
  tabs?: SubNavItem[];
  activeTab?: string;
  onTabSelect?: (key: string) => void;
  getTabHref?: (key: string) => string;
  actions?: React.ReactNode;
};

export function ListPageToolbar({ tabs, activeTab, onTabSelect, getTabHref, actions }: ListPageToolbarProps) {
  if (!tabs?.length && !actions) return null;

  return (
    <div className="flex items-center justify-between gap-4">
      {tabs?.length ? (
        <SubNav
          items={tabs}
          activeKey={activeTab ?? ''}
          onSelect={onTabSelect}
          getHref={getTabHref}
        />
      ) : (
        <div />
      )}
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
