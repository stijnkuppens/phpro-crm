'use client';

import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AccountOverviewTab } from './account-overview-tab';
import { AccountContactsTab } from './account-contacts-tab';
import { AccountCommunicationsTab } from './account-communications-tab';
import { AccountActivitiesTab } from './account-activities-tab';
import { AccountDealsTab } from '@/features/deals/components/account-deals-tab';
import { ContractsTab } from '@/features/contracts/components/contracts-tab';
import { AccountConsultantsTab } from '@/features/consultants/components/account-consultants-tab';
import { OmzetTab } from '@/features/revenue/components/omzet-tab';
import type { AccountWithRelations } from '../types';
import type { DealWithRelations } from '@/features/deals/types';
import type { Contract, HourlyRate, SlaRateWithTools } from '@/features/contracts/types';
import { getCurrentRate, type ActiveConsultantWithDetails } from '@/features/consultants/types';
import type { AccountRevenue } from '@/features/revenue/types';
import type { ContactWithDetails } from '@/features/contacts/types';
import type { ActivityWithRelations } from '@/features/activities/types';
import type { CommunicationWithDetails } from '@/features/communications/types';

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
};

const fmt = new Intl.NumberFormat('nl-BE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const typeStyles: Record<string, string> = {
  Klant: 'bg-green-100 text-green-700',
  Prospect: 'bg-blue-100 text-blue-700',
  Partner: 'bg-purple-100 text-purple-700',
};

export function AccountDetail({ account, deals, contract, hourlyRates, slaRates, consultants, accountRevenue, contacts, activities, activitiesCount, communications, communicationsCount }: Props) {
  const pipelineValue = deals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const monthlyRevenue = consultants.reduce((sum, c) => sum + getCurrentRate(c) * 8 * 21, 0);
  const initials = account.name.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');

  return (
    <div className="space-y-6">
      {/* Account Banner */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-4 px-5 py-4">
          {/* Avatar */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold truncate">{account.name}</h2>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${typeStyles[account.type] ?? 'bg-muted text-muted-foreground'}`}>
                {account.type}
              </span>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${account.status === 'Actief' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
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

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="communicatie">Communicatie</TabsTrigger>
          <TabsTrigger value="contracten">Contracten & Tarieven</TabsTrigger>
          <TabsTrigger value="consultants">
            Consultants{consultants.length > 0 && <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">{consultants.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="contacts">
            Contacts{contacts.length > 0 && <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">{contacts.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="deals">
            Deals{deals.length > 0 && <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">{deals.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="activiteiten">
            Activiteiten{activities.length > 0 && <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">{activities.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="omzet">Omzet</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <AccountOverviewTab account={account} contract={contract} contacts={contacts} />
        </TabsContent>
        <TabsContent value="communicatie">
          <AccountCommunicationsTab accountId={account.id} initialData={communications} initialCount={communicationsCount} />
        </TabsContent>
        <TabsContent value="contracten">
          <ContractsTab contract={contract} hourlyRates={hourlyRates} slaRates={slaRates} />
        </TabsContent>
        <TabsContent value="consultants">
          <AccountConsultantsTab consultants={consultants} />
        </TabsContent>
        <TabsContent value="contacts">
          <AccountContactsTab accountId={account.id} />
        </TabsContent>
        <TabsContent value="deals">
          <AccountDealsTab deals={deals} />
        </TabsContent>
        <TabsContent value="activiteiten">
          <AccountActivitiesTab accountId={account.id} initialData={activities} initialCount={activitiesCount} />
        </TabsContent>
        <TabsContent value="omzet">
          <OmzetTab accountId={account.id} initialData={accountRevenue} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
