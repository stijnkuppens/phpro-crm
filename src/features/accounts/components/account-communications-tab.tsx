'use client';

import { useEffect, useCallback } from 'react';
import { useEntity } from '@/lib/hooks/use-entity';
import { Badge } from '@/components/ui/badge';
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

  const load = useCallback(() => {
    fetchList({ page: 1 });
  }, [fetchList]);

  useEffect(() => {
    load();
  }, [load]);

  const comms = data.filter((c) => c.account_id === accountId);

  if (loading) {
    return <div className="py-8 text-center text-muted-foreground">Laden...</div>;
  }

  if (comms.length === 0) {
    return <div className="py-8 text-center text-muted-foreground">Geen communicatie gevonden.</div>;
  }

  return (
    <div className="mt-4 space-y-3">
      {comms.map((comm) => (
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
  );
}
