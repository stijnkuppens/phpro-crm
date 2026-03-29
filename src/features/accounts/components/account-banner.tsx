'use client';

import { AvatarUpload } from '@/components/admin/avatar-upload';
import { StatusBadge } from '@/components/admin/status-badge';
import { updateAccountAvatar } from '../actions/update-account-avatar';
import { formatNumber } from '@/lib/format';
import type { AccountWithRelations } from '../types';
import { ACCOUNT_TYPE_STYLES } from '../types';
import type { AccountBannerStats } from '../queries/get-account-banner-stats';

type Props = {
  account: AccountWithRelations;
  stats: AccountBannerStats;
};

export function AccountBanner({ account, stats }: Props) {
  const initials = account.name.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-4 px-5 py-4">
        {/* Avatar */}
        <AvatarUpload
          currentPath={account.logo_url}
          fallback={initials}
          storagePath={`accounts/${account.id}`}
          round={false}
          onUploaded={async (path) => {
            await updateAccountAvatar(account.id, path);
          }}
        />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold truncate">{account.name}</h2>
            <StatusBadge colorMap={ACCOUNT_TYPE_STYLES} value={account.type} className="text-[11px]">
              {account.type}
            </StatusBadge>
            <StatusBadge positive={account.status === 'Actief'} className="text-[11px]">
              {account.status}
            </StatusBadge>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground mt-0.5">
            {account.industry && <span>{account.industry}</span>}
            {account.size && <><span>·</span><span>{account.size} mw.</span></>}
            {account.domain && <span>{account.domain}</span>}
            {account.website && (
              <a href={`https://${account.website}`} target="_blank" rel="noopener" className="text-primary hover:underline">
                {account.website}
              </a>
            )}
            {account.phone && <span>{account.phone}</span>}
          </div>
        </div>

        {/* Stats */}
        <div className="hidden md:flex items-stretch gap-px">
          <div className="rounded-l-lg border border-primary/20 bg-primary/5 px-5 py-2 text-center">
            <p className="text-xl font-bold text-primary">{stats.consultantCount}</p>
            <p className="text-[11px] text-muted-foreground">Consultants</p>
          </div>
          <div className="border-y border-primary/20 bg-primary/5 px-5 py-2 text-center">
            <p className="text-xl font-bold text-primary">€ {formatNumber(stats.monthlyRevenue)}</p>
            <p className="text-[11px] text-muted-foreground">Omzet/mnd</p>
          </div>
          <div className="rounded-r-lg border border-primary/20 bg-primary/5 px-5 py-2 text-center">
            <p className="text-xl font-bold text-primary">€ {formatNumber(stats.pipelineValue)}</p>
            <p className="text-[11px] text-muted-foreground">Pipeline</p>
          </div>
        </div>
      </div>
    </div>
  );
}
