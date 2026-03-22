'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ActivityWithRelations } from '@/features/activities/types';
import type { TaskWithRelations } from '@/features/tasks/types';
import type { CommunicationWithDetails } from '@/features/communications/types';
import { DealLinkedTabs } from './deal-linked-tabs';
import { CloseDealModal } from './close-deal-modal';
import type { DealWithRelations } from '../types';
import { formatEUR } from '@/lib/format';

type Props = {
  deal: DealWithRelations;
  activities: ActivityWithRelations[];
  tasks: TaskWithRelations[];
  communications: CommunicationWithDetails[];
};

const FC_COLORS: Record<string, string> = {
  Commit: 'bg-green-100 text-green-800',
  'Best Case': 'bg-blue-100 text-blue-800',
  Pipeline: 'bg-purple-100 text-purple-800',
  Omit: 'bg-gray-100 text-gray-800',
};

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex">
      <span className="text-muted-foreground w-32 shrink-0">{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function DealDetail({ deal, activities, tasks, communications }: Props) {
  const [showClose, setShowClose] = useState(false);
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {!deal.closed_at && (
        <div className="lg:col-span-2 flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setShowClose(true)}>
            Deal sluiten
          </Button>
          <CloseDealModal
            dealId={deal.id}
            open={showClose}
            onOpenChange={setShowClose}
            onSuccess={() => router.refresh()}
          />
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Deal Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <InfoRow label="Account" value={deal.account?.name} />
          <InfoRow label="Pipeline" value={deal.pipeline?.name} />
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-32">Stage</span>
            {deal.stage && (
              <Badge style={{ backgroundColor: deal.stage.color, color: 'white' }}>
                {deal.stage.name}
              </Badge>
            )}
          </div>
          <InfoRow label="Bedrag" value={formatEUR(Number(deal.amount ?? 0))} />
          <InfoRow label="Kans" value={`${deal.probability ?? 0}%`} />
          <InfoRow label="Close Date" value={deal.close_date ? new Date(deal.close_date).toLocaleDateString('nl-BE') : undefined} />
          <InfoRow label="Lead Source" value={deal.lead_source} />
          <InfoRow label="Herkomst" value={deal.origin} />
          {deal.forecast_category && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-32">Forecast</span>
              <Badge className={FC_COLORS[deal.forecast_category] ?? ''}>
                {deal.forecast_category}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Contact & Eigenaar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <InfoRow label="Contact" value={deal.contact ? `${deal.contact.first_name} ${deal.contact.last_name}` : undefined} />
          <InfoRow label="Owner" value={deal.owner?.full_name} />
          {deal.origin === 'cronos' && (
            <>
              <InfoRow label="Cronos CC" value={deal.cronos_cc} />
              <InfoRow label="Cronos Contact" value={deal.cronos_contact} />
              <InfoRow label="Cronos E-mail" value={deal.cronos_email} />
            </>
          )}
          <InfoRow label="Consultant Rol" value={deal.consultant_role} />
        </CardContent>
      </Card>

      {deal.description && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Beschrijving</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{deal.description}</p>
          </CardContent>
        </Card>
      )}

      {deal.closed_type && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Afsluiting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <InfoRow label="Type" value={deal.closed_type} />
            <InfoRow label="Reden" value={deal.closed_reason} />
            <InfoRow label="Notities" value={deal.closed_notes} />
            <InfoRow label="Datum" value={deal.closed_at ? new Date(deal.closed_at).toLocaleDateString('nl-BE') : undefined} />
            {deal.longterm_date && (
              <InfoRow label="Follow-up" value={new Date(deal.longterm_date).toLocaleDateString('nl-BE')} />
            )}
          </CardContent>
        </Card>
      )}

      <div className="lg:col-span-2">
        <DealLinkedTabs
          activities={activities}
          tasks={tasks}
          communications={communications}
        />
      </div>
    </div>
  );
}
