'use client';

import { useEffect, useCallback, useState } from 'react';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEntity } from '@/lib/hooks/use-entity';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/admin/data-table';
import { contactColumns } from '@/features/contacts/columns';
import { deleteContact } from '@/features/contacts/actions/delete-contact';
import { ContactFormModal } from '@/features/contacts/components/contact-form-modal';
import { ContactViewModal } from '@/features/contacts/components/contact-view-modal';
import type { Contact } from '@/features/contacts/types';

type Props = {
  accountId: string;
};

export function AccountContactsTab({ accountId }: Props) {
  const { data, total, loading, refreshing, fetchList } = useEntity<Contact>({
    table: 'contacts',
    select: '*, account:accounts!account_id(id, name)',
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

  const handleDelete = async (id: string) => {
    const result = await deleteContact(id);
    if (result.success) {
      toast.success('Contact verwijderd');
      load();
    } else {
      toast.error(typeof result.error === 'string' ? result.error : 'Verwijderen mislukt');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Nieuw Contact
        </Button>
      </div>

      <DataTable
        columns={contactColumns as any}
        data={data}
        pagination={{ page: 1, pageSize: 100, total }}
        loading={loading}
        refreshing={refreshing}
        rowActions={(row) => [
          { icon: Eye, label: 'Bekijken', onClick: () => setViewId(row.id) },
          { icon: Pencil, label: 'Bewerken', onClick: () => setEditId(row.id) },
          { icon: Trash2, label: 'Verwijderen', variant: 'destructive' as const, confirm: { title: 'Contact verwijderen?', description: 'Dit verwijdert het contact permanent.' }, onClick: () => handleDelete(row.id) },
        ]}
      />

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
