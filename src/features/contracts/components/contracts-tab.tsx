'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { SquarePen, TrendingUp, ExternalLink, Download } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ContractsSummaryCards } from './contracts-summary-cards';
import { HourlyRatesSubTab } from './hourly-rates-sub-tab';
import { SlaRatesSubTab } from './sla-rates-sub-tab';
import { IndexationSubTab } from './indexation-sub-tab';
import dynamic from 'next/dynamic';
import type { Contract, HourlyRate, SlaRateWithTools } from '../types';

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
  const handleDownload = useCallback(async (path: string) => {
    const supabase = createBrowserClient();
    const { data, error } = await supabase.storage.from('documents').createSignedUrl(path, 300);
    if (error || !data?.signedUrl) {
      toast.error('Download mislukt');
      return;
    }
    window.open(data.signedUrl, '_blank');
  }, []);
  const [wizardOpen, setWizardOpen] = useState(false);

  function handleSaved() {
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
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/admin/accounts/${accountId}/contracten/edit`} />}>
            <SquarePen className="h-4 w-4 mr-1.5" />
            Bewerken
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <ContractsSummaryCards contract={contract} indexationConfig={indexationConfig} />

      {/* Bestelbonnen */}
      {(contract?.purchase_orders_url || contract?.purchase_orders_doc_path) && (
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">Bestelbonnen:</span>
          {contract.purchase_orders_url && (
            <a
              href={contract.purchase_orders_url}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 text-sm text-primary-action hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {contract.purchase_orders_url}
            </a>
          )}
          {contract.purchase_orders_doc_path && (
            <button
              type="button"
              onClick={() => handleDownload(contract.purchase_orders_doc_path!)}
              className="inline-flex items-center gap-1.5 text-sm text-primary-action hover:underline cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              {contract.purchase_orders_doc_path.split('/').pop()?.replace(/^\d+_/, '') ?? 'Document'}
            </button>
          )}
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
          <HourlyRatesSubTab hourlyRates={hourlyRates} />
        </TabsContent>

        <TabsContent value="sla">
          <SlaRatesSubTab slaRates={slaRates} hasServiceContract={contract?.has_service_contract ?? false} />
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
      {wizardOpen && (
        <IndexationWizard
          accountId={accountId}
          open={wizardOpen}
          draft={indexationDraft}
          onClose={handleSaved}
        />
      )}
    </div>
  );
}
