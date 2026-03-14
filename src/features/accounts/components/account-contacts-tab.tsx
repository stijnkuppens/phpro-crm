'use client';

import { useEffect, useCallback, useState } from 'react';
import { useEntity } from '@/lib/hooks/use-entity';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ContactForm } from '@/features/contacts/components/contact-form';
import type { Contact } from '@/features/contacts/types';

type Props = {
  accountId: string;
};

export function AccountContactsTab({ accountId }: Props) {
  const { data, loading, fetchList } = useEntity<Contact>({
    table: 'contacts',
    pageSize: 100,
  });
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(() => {
    fetchList({ page: 1 });
  }, [fetchList]);

  useEffect(() => {
    load();
  }, [load]);

  const contacts = data.filter((c) => c.account_id === accountId);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setModalOpen(true)}>Nieuw Contact</Button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-muted-foreground">Laden...</div>
      ) : contacts.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">Geen contacten gevonden.</div>
      ) : (
        <div className="mt-4 space-y-3">
          {contacts.map((contact) => (
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
            </div>
          ))}
        </div>
      )}

      <ContactForm
        open={modalOpen}
        onClose={() => { setModalOpen(false); load(); }}
        accountId={accountId}
      />
    </div>
  );
}
