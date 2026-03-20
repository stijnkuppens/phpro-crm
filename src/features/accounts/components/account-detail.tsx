'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AccountOverviewTab } from './account-overview-tab';
import { AccountContactsTab } from './account-contacts-tab';
import { AccountCommunicationsTab } from './account-communications-tab';
import { AccountDealsTab } from '@/features/deals/components/account-deals-tab';
import { ContractsTab } from '@/features/contracts/components/contracts-tab';
import { AccountConsultantsTab } from '@/features/consultants/components/account-consultants-tab';
import { OmzetTab } from '@/features/revenue/components/omzet-tab';
import type { AccountWithRelations } from '../types';
import type { DealWithRelations } from '@/features/deals/types';
import type { Contract, HourlyRate, SlaRateWithTools } from '@/features/contracts/types';
import type { ActiveConsultantWithDetails } from '@/features/consultants/types';
import type { AccountRevenue } from '@/features/revenue/types';

type Props = {
  account: AccountWithRelations;
  deals: DealWithRelations[];
  contract: Contract | null;
  hourlyRates: HourlyRate[];
  slaRates: SlaRateWithTools[];
  consultants: ActiveConsultantWithDetails[];
  accountRevenue: AccountRevenue[];
};

export function AccountDetail({ account, deals, contract, hourlyRates, slaRates, consultants, accountRevenue }: Props) {
  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="communicatie">Communicatie</TabsTrigger>
        <TabsTrigger value="contracten">Contracten & Tarieven</TabsTrigger>
        <TabsTrigger value="consultants">Consultants</TabsTrigger>
        <TabsTrigger value="contacts">Contacts</TabsTrigger>
        <TabsTrigger value="deals">Deals</TabsTrigger>
        <TabsTrigger value="omzet">Omzet</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <AccountOverviewTab account={account} />
      </TabsContent>
      <TabsContent value="communicatie">
        <AccountCommunicationsTab accountId={account.id} />
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
      <TabsContent value="omzet">
        <OmzetTab accountId={account.id} initialData={accountRevenue} />
      </TabsContent>
    </Tabs>
  );
}
