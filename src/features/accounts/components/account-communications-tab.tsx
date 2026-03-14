'use client';

import { useEffect, useCallback, useState } from 'react';
import { useEntity } from '@/lib/hooks/use-entity';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CommunicationModal } from '@/features/communications/components/communication-modal';
import type { Communication } from '@/features/communications/types';

type Props = {
  accountId: string;
};

const TYPE_LABELS: Record<string, string> = {
  email: 'E-mail',
  note: 'Notitie',
  meeting: 'Meeting',
  call: 'Telefoongesprek',
};

export function AccountCommunicationsTab({ accountId }: Props) {
  const { data, loading, fetchList } = useEntity<Communication>({
    table: 'communications',
    pageSize: 100,
  });
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(() => {
    fetchList({ page: 1, eqFilters: { account_id: accountId } });
  }, [fetchList, accountId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setModalOpen(true)}>Nieuwe Communicatie</Button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-muted-foreground">Laden...</div>
      ) : data.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">Geen communicatie gevonden.</div>
      ) : (
        <div className="mt-4 space-y-3">
          {data.map((comm) => (
            <div key={comm.id} className="p-3 border rounded-lg">
              <div className="flex items-center gap-3 mb-1">
                <Badge variant="outline">{TYPE_LABELS[comm.type] ?? comm.type}</Badge>
                <span className="font-medium text-sm">{comm.subject}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {new Date(comm.date).toLocaleDateString('nl-BE')}
                </span>
              </div>
              {comm.is_done && (
                <span className="text-xs text-green-600">Afgerond</span>
              )}
            </div>
          ))}
        </div>
      )}

      <CommunicationModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); load(); }}
        accountId={accountId}
      />
    </div>
  );
}
