'use client';

import { AvatarUpload } from '@/components/admin/avatar-upload';
import { StatusBadge } from '@/components/admin/status-badge';
import { formatNumber } from '@/lib/format';
import { updateAccountAvatar } from '../actions/update-account-avatar';
import type { AccountBannerStats } from '../queries/get-account-banner-stats';
import type { AccountWithRelations } from '../types';
import { ACCOUNT_TYPE_STYLES } from '../types';

type Props = {
  account: AccountWithRelations;
  stats: AccountBannerStats;
};

export function AccountBanner({ account, stats }: Props) {
  const initials = account.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5 sm:py-4">
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
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <h2 className="text-base font-semibold sm:text-lg">{account.name}</h2>
            <StatusBadge
              colorMap={ACCOUNT_TYPE_STYLES}
              value={account.type}
              className="text-[11px]"
            >
              {account.type}
            </StatusBadge>
            <StatusBadge positive={account.status === 'Actief'} className="text-[11px]">
              {account.status}
            </StatusBadge>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground sm:text-sm sm:gap-x-3">
            {account.industry && <span>{account.industry}</span>}
            {account.size && (
              <>
                <span className="hidden sm:inline">·</span>
                <span>{account.size} mw.</span>
              </>
            )}
            {account.website && (
              <a
                href={`https://${account.website}`}
                target="_blank"
                rel="noopener"
                className="text-primary hover:underline truncate max-w-[140px] sm:max-w-none"
              >
                {account.website}
              </a>
            )}
            <span className="hidden sm:inline">{account.phone}</span>
          </div>
        </div>

        {/* Desktop stats */}
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

      {/* Mobile stats row */}
      <div className="grid grid-cols-3 gap-px border-t border-primary/20 bg-primary/20 md:hidden">
        <div className="bg-primary/5 px-2 py-2 text-center">
          <p className="text-sm font-bold text-primary">{stats.consultantCount}</p>
          <p className="text-[10px] text-muted-foreground">Consultants</p>
        </div>
        <div className="bg-primary/5 px-2 py-2 text-center">
          <p className="truncate text-sm font-bold text-primary">
            €{formatNumber(stats.monthlyRevenue)}
          </p>
          <p className="text-[10px] text-muted-foreground">Omzet/mnd</p>
        </div>
        <div className="bg-primary/5 px-2 py-2 text-center">
          <p className="truncate text-sm font-bold text-primary">
            €{formatNumber(stats.pipelineValue)}
          </p>
          <p className="text-[10px] text-muted-foreground">Pipeline</p>
        </div>
      </div>
    </div>
  );
}
