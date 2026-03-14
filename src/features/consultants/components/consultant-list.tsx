'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { getContractStatus, getCurrentRate, type ActiveConsultantWithDetails, type ContractStatus } from '../types';
import { ConsultantDetailModal } from './consultant-detail-modal';

type Props = {
  consultants: ActiveConsultantWithDetails[];
};

const statusColors: Record<ContractStatus, string> = {
  actief: 'bg-green-100 text-green-800',
  waarschuwing: 'bg-yellow-100 text-yellow-800',
  kritiek: 'bg-red-100 text-red-800',
  verlopen: 'bg-gray-100 text-gray-800',
  onbepaald: 'bg-blue-100 text-blue-800',
  stopgezet: 'bg-gray-300 text-gray-600',
};

const fmt = (n: number) =>
  new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

export function ConsultantListView({ consultants }: Props) {
  const [selected, setSelected] = useState<ActiveConsultantWithDetails | null>(null);

  if (consultants.length === 0) {
    return <p className="text-center text-muted-foreground py-8">Geen actieve consultants.</p>;
  }

  return (
    <>
      <div className="space-y-3">
        {consultants.map((c) => {
          const status = getContractStatus(c);
          const rate = getCurrentRate(c);
          return (
            <Card key={c.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelected(c)}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="font-medium text-sm">{c.first_name} {c.last_name}</div>
                  <div className="text-xs text-muted-foreground">{c.role} - {c.city}</div>
                </div>
                <div className="text-sm">{c.account?.name ?? c.client_name ?? ''}</div>
                <div className="text-sm font-medium">{fmt(rate)}/u</div>
                <Badge className={statusColors[status]}>{status}</Badge>
                <div className="text-xs text-muted-foreground">
                  {c.start_date ? new Date(c.start_date).toLocaleDateString('nl-BE') : ''} -
                  {c.is_indefinite ? ' onbepaald' : c.end_date ? ` ${new Date(c.end_date).toLocaleDateString('nl-BE')}` : ''}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selected && (
        <ConsultantDetailModal
          consultant={selected}
          open={!!selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
