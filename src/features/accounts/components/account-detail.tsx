'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AccountOverviewTab } from './account-overview-tab';
import { AccountContactsTab } from './account-contacts-tab';
import { AccountCommunicationsTab } from './account-communications-tab';
import { AccountDealsTab } from '@/features/deals/components/account-deals-tab';
import type { AccountWithRelations } from '../types';
import type { DealWithRelations } from '@/features/deals/types';

type Props = {
  account: AccountWithRelations;
  deals: DealWithRelations[];
};

export function AccountDetail({ account, deals }: Props) {
  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="communicatie">Communicatie</TabsTrigger>
        <TabsTrigger value="contracten">Contracten & Tarieven</TabsTrigger>
        <TabsTrigger value="consultants">Consultants</TabsTrigger>
        <TabsTrigger value="contacts">Contacts</TabsTrigger>
        <TabsTrigger value="deals">Deals</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <AccountOverviewTab account={account} />
      </TabsContent>
      <TabsContent value="communicatie">
        <AccountCommunicationsTab accountId={account.id} />
      </TabsContent>
      <TabsContent value="contracten">
        <div className="py-8 text-center text-muted-foreground">
          Contracten & Tarieven — beschikbaar na Layer 4
        </div>
      </TabsContent>
      <TabsContent value="consultants">
        <div className="py-8 text-center text-muted-foreground">
          Consultants — beschikbaar na Layer 4
        </div>
      </TabsContent>
      <TabsContent value="contacts">
        <AccountContactsTab accountId={account.id} />
      </TabsContent>
      <TabsContent value="deals">
        <AccountDealsTab deals={deals} />
      </TabsContent>
    </Tabs>
  );
}
