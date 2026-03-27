'use client';

import { useCallback, useState } from 'react';
import { SquarePen, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEntity } from '@/lib/hooks/use-entity';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/admin/data-table';
import { contactColumns } from '@/features/contacts/columns';
import { deleteContact } from '@/features/contacts/actions/delete-contact';
import { ContactFormModal } from '@/features/contacts/components/contact-form-modal';
import { ContactViewModal } from '@/features/contacts/components/contact-view-modal';
import type { Contact, ContactWithDetails } from '@/features/contacts/types';

type Props = {
  accountId: string;
  initialData: ContactWithDetails[];
  initialCount: number;
};

export function AccountContactsTab({ accountId, initialData, initialCount }: Props) {
  const { data, total, loading, refreshing, fetchList } = useEntity<Contact>({
    table: 'contacts',
    select: '*, account:accounts!account_id(id, name)',
    pageSize: 100,
    initialData: initialData as unknown as Contact[],
    initialCount,
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const load = useCallback(() => {
    fetchList({ page: 1, eqFilters: { account_id: accountId } });
  }, [fetchList, accountId]);

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
        tableId="account-contacts"
        columns={contactColumns as any}
        data={data}
        onRowClick={(row) => setViewId(row.id)}
        pagination={{ page: 1, pageSize: 100, total }}
        loading={loading}
        refreshing={refreshing}
        rowActions={(row) => [
          { icon: SquarePen, label: 'Bewerken', onClick: () => setEditId(row.id) },
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

      {viewId && (
        <ContactViewModal
          key={viewId}
          contactId={viewId}
          onClose={() => setViewId(null)}
          onEdit={(id) => { setViewId(null); setEditId(id); }}
        />
      )}

      {editId && (
        <ContactFormModal
          key={editId}
          contactId={editId}
          accountId={accountId}
          open
          onClose={() => setEditId(null)}
          onSaved={() => { setEditId(null); load(); }}
        />
      )}
    </div>
  );
}
