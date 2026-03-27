'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Pencil, TrendingUp, ExternalLink } from 'lucide-react';
import { ContractsSummaryCards } from './contracts-summary-cards';
import { HourlyRatesSubTab } from './hourly-rates-sub-tab';
import { SlaRatesSubTab } from './sla-rates-sub-tab';
import { IndexationSubTab } from './indexation-sub-tab';
import dynamic from 'next/dynamic';
import type { Contract, HourlyRate, SlaRateWithTools } from '../types';

const ContractEditModal = dynamic(() => import('./contract-edit-modal').then(m => ({ default: m.ContractEditModal })), { ssr: false });
const HourlyRatesEditModal = dynamic(() => import('./hourly-rates-edit-modal').then(m => ({ default: m.HourlyRatesEditModal })), { ssr: false });
const SlaRatesEditModal = dynamic(() => import('./sla-rates-edit-modal').then(m => ({ default: m.SlaRatesEditModal })), { ssr: false });
const IndexationWizard = dynamic(() => import('@/features/indexation/components/indexation-wizard').then(m => ({ default: m.IndexationWizard })), { ssr: false });
import type { IndexationConfig } from '@/features/indexation/types';
import type { IndexationDraftFull } from '@/features/indexation/types';
import type { IndexationHistoryFull } from '@/features/indexation/queries/get-indexation-history';

type Props = {
  accountId: string;
  contract: Contract | null;
  hourlyRates: HourlyRate[];
  slaRates: SlaRateWithTools[];
  indexationConfig: IndexationConfig | null;
  indexationDraft: IndexationDraftFull | null;
  indexationHistory: IndexationHistoryFull[];
};

export function ContractsTab({
  accountId,
  contract,
  hourlyRates,
  slaRates,
  indexationConfig,
  indexationDraft,
  indexationHistory,
}: Props) {
  const router = useRouter();
  const [contractEditOpen, setContractEditOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingHourlyYear, setEditingHourlyYear] = useState<number | null>(null);
  const [editingSlaYear, setEditingSlaYear] = useState<number | null>(null);

  function handleSaved() {
    setContractEditOpen(false);
    setEditingHourlyYear(null);
    setEditingSlaYear(null);
    setWizardOpen(false);
    router.refresh();
  }

  return (
    <div className="space-y-6 mt-4">
      {/* Header with action buttons */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Contracten & Tarieven</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setWizardOpen(true)}>
            <TrendingUp className="h-4 w-4 mr-1.5" />
            Indexering simuleren
          </Button>
          <Button variant="outline" size="sm" onClick={() => setContractEditOpen(true)}>
            <Pencil className="h-4 w-4 mr-1.5" />
            Bewerken
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <ContractsSummaryCards contract={contract} indexationConfig={indexationConfig} />

      {/* Bestelbonnen link */}
      {contract?.purchase_orders_url && (
        <div className="flex items-center gap-2 text-sm">
          <ExternalLink className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Bestelbonnen (Confluence):</span>
          <a
            href={contract.purchase_orders_url}
            target="_blank"
            rel="noopener"
            className="text-primary-action hover:underline"
          >
            {contract.purchase_orders_url}
          </a>
        </div>
      )}

      {/* Sub-tabs */}
      <Tabs defaultValue="uurtarieven">
        <TabsList>
          <TabsTrigger value="uurtarieven">Uurtarieven</TabsTrigger>
          <TabsTrigger value="sla">SLA Tarieven</TabsTrigger>
          <TabsTrigger value="indexering" className="flex items-center gap-1.5">
            Indexering
            <Badge className="bg-primary/15 text-primary-action border-0 text-[10px] h-4 px-1.5">{indexationHistory.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="uurtarieven">
          <HourlyRatesSubTab hourlyRates={hourlyRates} onEditYear={setEditingHourlyYear} />
        </TabsContent>

        <TabsContent value="sla">
          <SlaRatesSubTab slaRates={slaRates} hasServiceContract={contract?.has_service_contract ?? false} onEditYear={setEditingSlaYear} />
        </TabsContent>

        <TabsContent value="indexering">
          <IndexationSubTab
            accountId={accountId}
            indexationDraft={indexationDraft}
            indexationHistory={indexationHistory}
            onSimulate={() => setWizardOpen(true)}
            onApproved={handleSaved}
          />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {contractEditOpen && (
        <ContractEditModal
          accountId={accountId}
          contract={contract}
          indexationConfig={indexationConfig}
          open={contractEditOpen}
          onClose={() => setContractEditOpen(false)}
          onSaved={handleSaved}
        />
      )}

      {editingHourlyYear !== null && (
        <HourlyRatesEditModal
          accountId={accountId}
          year={editingHourlyYear}
          existingRates={hourlyRates}
          open={editingHourlyYear !== null}
          onClose={() => setEditingHourlyYear(null)}
          onSaved={handleSaved}
        />
      )}

      {editingSlaYear !== null && (
        <SlaRatesEditModal
          accountId={accountId}
          year={editingSlaYear}
          existingRate={slaRates.find((s) => s.year === editingSlaYear) ?? null}
          open={editingSlaYear !== null}
          onClose={() => setEditingSlaYear(null)}
          onSaved={handleSaved}
        />
      )}

      {wizardOpen && (
        <IndexationWizard
          accountId={accountId}
          open={wizardOpen}
          onClose={handleSaved}
        />
      )}
    </div>
  );
}
