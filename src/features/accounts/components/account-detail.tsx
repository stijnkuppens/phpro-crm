'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Building2, MessageSquare, FileText, Users, Contact, Handshake, Activity, TrendingUp, type LucideIcon } from 'lucide-react';
import { AccountOverviewTab } from './account-overview-tab';
import { AccountContactsTab } from './account-contacts-tab';
import { AccountCommunicationsTab } from './account-communications-tab';
import { AccountActivitiesTab } from './account-activities-tab';
import { AccountDealsTab } from '@/features/deals/components/account-deals-tab';
import { ContractsTab } from '@/features/contracts/components/contracts-tab';
import { AccountConsultantsTab } from '@/features/consultants/components/account-consultants-tab';
import { OmzetTab } from '@/features/revenue/components/omzet-tab';
import type { AccountWithRelations, ReferenceOption } from '../types';
import type { DealWithRelations } from '@/features/deals/types';
import type { Contract, HourlyRate, SlaRateWithTools } from '@/features/contracts/types';
import { getCurrentRate, type ActiveConsultantWithDetails } from '@/features/consultants/types';
import type { AccountRevenue } from '@/features/revenue/types';
import type { ContactWithDetails } from '@/features/contacts/types';
import type { ActivityWithRelations } from '@/features/activities/types';
import type { CommunicationWithDetails } from '@/features/communications/types';
import type { IndexationConfig } from '@/features/indexation/types';
import type { IndexationDraftFull } from '@/features/indexation/types';
import type { IndexationHistoryFull } from '@/features/indexation/queries/get-indexation-history';
import type { BenchConsultantWithLanguages } from '@/features/bench/types';
import { AvatarUpload } from '@/components/admin/avatar-upload';
import { createBrowserClient } from '@/lib/supabase/client';

type Props = {
  account: AccountWithRelations;
  deals: DealWithRelations[];
  contract: Contract | null;
  hourlyRates: HourlyRate[];
  slaRates: SlaRateWithTools[];
  consultants: ActiveConsultantWithDetails[];
  accountRevenue: AccountRevenue[];
  contacts: ContactWithDetails[];
  activities: ActivityWithRelations[];
  activitiesCount: number;
  communications: CommunicationWithDetails[];
  communicationsCount: number;
  internalPeople?: ReferenceOption[];
  consultantRoles?: { value: string; label: string }[];
  indexationConfig?: IndexationConfig | null;
  indexationDraft?: IndexationDraftFull | null;
  indexationHistory?: IndexationHistoryFull[];
  benchConsultants: BenchConsultantWithLanguages[];
};

const fmt = new Intl.NumberFormat('nl-BE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const typeStyles: Record<string, string> = {
  Klant: 'bg-green-100 text-green-700',
  Prospect: 'bg-blue-100 text-blue-700',
  Partner: 'bg-orange-100 text-orange-700',
};

type NavItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  count?: number;
};

export function AccountDetail({ account, deals, contract, hourlyRates, slaRates, consultants, accountRevenue, contacts, activities, activitiesCount, communications, communicationsCount, internalPeople, consultantRoles, indexationConfig, indexationDraft, indexationHistory, benchConsultants }: Props) {
  const [activeSection, setActiveSection] = useState('overview');
  const pipelineValue = deals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const monthlyRevenue = consultants.reduce((sum, c) => sum + getCurrentRate(c) * 8 * 21, 0);
  const initials = account.name.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');

  const navItems: NavItem[] = [
    { key: 'overview', label: 'Overview', icon: Building2 },
    { key: 'communicatie', label: 'Communicatie', icon: MessageSquare },
    { key: 'contracten', label: 'Contracten', icon: FileText },
    { key: 'consultants', label: 'Consultants', icon: Users, count: consultants.length },
    { key: 'contacts', label: 'Contacts', icon: Contact, count: contacts.length },
    { key: 'deals', label: 'Deals', icon: Handshake, count: deals.length },
    { key: 'activiteiten', label: 'Activiteiten', icon: Activity, count: activities.length },
    { key: 'omzet', label: 'Omzet', icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      {/* Account Banner */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-4 px-5 py-4">
          {/* Avatar */}
          <AvatarUpload
            currentPath={account.logo_url}
            fallback={initials}
            storagePath={`accounts/${account.id}`}
            round={false}
            onUploaded={async (path) => {
              const supabase = createBrowserClient();
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              await (supabase.from('accounts') as any).update({ logo_url: path }).eq('id', account.id);
            }}
          />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold truncate">{account.name}</h2>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${typeStyles[account.type] ?? 'bg-muted text-muted-foreground'}`}>
                {account.type}
              </span>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${account.status === 'Actief' ? 'bg-primary/15 text-primary-action' : 'bg-muted text-muted-foreground'}`}>
                {account.status}
              </span>
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
              <p className="text-xl font-bold text-primary">{consultants.length}</p>
              <p className="text-[11px] text-muted-foreground">Consultants</p>
            </div>
            <div className="border-y border-primary/20 bg-primary/5 px-5 py-2 text-center">
              <p className="text-xl font-bold text-primary">€ {fmt.format(monthlyRevenue)}</p>
              <p className="text-[11px] text-muted-foreground">Omzet/mnd</p>
            </div>
            <div className="rounded-r-lg border border-primary/20 bg-primary/5 px-5 py-2 text-center">
              <p className="text-xl font-bold text-primary">€ {fmt.format(pipelineValue)}</p>
              <p className="text-[11px] text-muted-foreground">Pipeline</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation bar */}
      <nav className="flex items-center gap-1 rounded-xl border bg-card shadow-sm px-2 py-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActiveSection(item.key)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary-action'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
              {item.count != null && item.count > 0 && (
                <Badge className="bg-primary/15 text-primary-action border-0 text-[10px] h-4 px-1.5">{item.count}</Badge>
              )}
            </button>
          );
        })}
      </nav>

      {/* Content */}
      {activeSection === 'overview' && (
        <AccountOverviewTab account={account} contract={contract} contacts={contacts} internalPeople={internalPeople} />
      )}
      {activeSection === 'communicatie' && (
        <AccountCommunicationsTab
          accountId={account.id}
          initialData={communications}
          initialCount={communicationsCount}
          contacts={contacts.map((c) => ({ id: c.id, first_name: c.first_name, last_name: c.last_name }))}
          deals={deals.map((d) => ({ id: d.id, title: d.title }))}
        />
      )}
      {activeSection === 'contracten' && (
        <ContractsTab
          accountId={account.id}
          contract={contract}
          hourlyRates={hourlyRates}
          slaRates={slaRates}
          indexationConfig={indexationConfig ?? null}
          indexationDraft={indexationDraft ?? null}
          indexationHistory={indexationHistory ?? []}
        />
      )}
      {activeSection === 'consultants' && (
        <AccountConsultantsTab accountId={account.id} accountName={account.name} consultants={consultants} roles={consultantRoles ?? []} benchConsultants={benchConsultants} />
      )}
      {activeSection === 'contacts' && (
        <AccountContactsTab accountId={account.id} initialData={contacts} initialCount={contacts.length} />
      )}
      {activeSection === 'deals' && (
        <AccountDealsTab deals={deals} />
      )}
      {activeSection === 'activiteiten' && (
        <AccountActivitiesTab accountId={account.id} initialData={activities} initialCount={activitiesCount} />
      )}
      {activeSection === 'omzet' && (
        <OmzetTab accountId={account.id} initialData={accountRevenue} />
      )}
    </div>
  );
}
