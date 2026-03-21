'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { getContractStatus, getCurrentRate, contractStatusColors, type ActiveConsultantWithDetails } from '../types';
import { ConsultantDetailModal } from './consultant-detail-modal';
import { AddConsultantModal } from './add-consultant-modal';

type Props = {
  accountId: string;
  consultants: ActiveConsultantWithDetails[];
  roles: { value: string; label: string }[];
};

const fmt = (n: number) =>
  new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

export function AccountConsultantsTab({ accountId, consultants, roles }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<ActiveConsultantWithDetails | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Consultants</h3>
        <Button size="sm" onClick={() => setAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Consultant koppelen
        </Button>
      </div>

      {consultants.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">Geen consultants voor dit account.</p>
          <Button variant="outline" onClick={() => setAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Consultant koppelen
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {consultants.map((c) => {
            const status = getContractStatus(c);
            const rate = getCurrentRate(c);
            return (
              <Card
                key={c.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelected(c)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{c.first_name} {c.last_name}</div>
                    <div className="text-xs text-muted-foreground">{c.role} - {c.city}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{fmt(rate)}/u</div>
                    <div className="text-xs text-muted-foreground">{fmt(rate * 8 * 21)}/maand</div>
                  </div>
                  <Badge className={contractStatusColors[status]}>{status}</Badge>
                  <div className="text-xs text-muted-foreground">
                    {c.start_date ? new Date(c.start_date).toLocaleDateString('nl-BE') : ''} -
                    {c.is_indefinite ? ' onbepaald' : c.end_date ? ` ${new Date(c.end_date).toLocaleDateString('nl-BE')}` : ''}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selected && (
        <ConsultantDetailModal
          consultant={selected}
          open={!!selected}
          onClose={() => setSelected(null)}
        />
      )}

      <AddConsultantModal
        accountId={accountId}
        roles={roles}
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSaved={() => {
          setAddModalOpen(false);
          router.refresh();
        }}
      />
    </>
  );
}
