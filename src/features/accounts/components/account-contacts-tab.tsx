'use client';

import { useEffect, useCallback, useState } from 'react';
import { Eye, Pencil } from 'lucide-react';
import { useEntity } from '@/lib/hooks/use-entity';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ContactFormModal } from '@/features/contacts/components/contact-form-modal';
import { ContactViewModal } from '@/features/contacts/components/contact-view-modal';
import type { Contact } from '@/features/contacts/types';

type Props = {
  accountId: string;
};

export function AccountContactsTab({ accountId }: Props) {
  const { data, loading, fetchList } = useEntity<Contact>({
    table: 'contacts',
    pageSize: 100,
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const load = useCallback(() => {
    fetchList({ page: 1, eqFilters: { account_id: accountId } });
  }, [fetchList, accountId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>Nieuw Contact</Button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-muted-foreground">Laden...</div>
      ) : data.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">Geen contacten gevonden.</div>
      ) : (
        <div className="mt-4 space-y-3">
          {data.map((contact) => (
            <div key={contact.id} className="flex items-center gap-4 p-3 border rounded-lg">
              <div className="flex-1">
                <div className="font-medium text-sm">
                  {contact.first_name} {contact.last_name}
                  {contact.is_pinned && <span className="ml-1 text-yellow-500">★</span>}
                </div>
                <div className="text-xs text-muted-foreground">{contact.title}</div>
              </div>
              <div className="flex items-center gap-2">
                {contact.role && <Badge variant="outline">{contact.role}</Badge>}
                {contact.is_steerco && <Badge variant="secondary">Steerco</Badge>}
              </div>
              <div className="text-xs text-muted-foreground">{contact.email}</div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setViewId(contact.id)}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setEditId(contact.id)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ContactFormModal
        contactId={null}
        accountId={accountId}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={() => { setCreateOpen(false); load(); }}
      />

      <ContactViewModal
        contactId={viewId}
        onClose={() => setViewId(null)}
        onEdit={(id) => { setViewId(null); setEditId(id); }}
      />

      <ContactFormModal
        contactId={editId}
        accountId={accountId}
        open={editId !== null}
        onClose={() => setEditId(null)}
        onSaved={() => { setEditId(null); load(); }}
      />
    </div>
  );
}
