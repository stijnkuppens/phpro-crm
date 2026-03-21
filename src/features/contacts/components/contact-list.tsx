'use client';

import { useState, useCallback, useEffect } from 'react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEntity } from '@/lib/hooks/use-entity';
import DataTable from '@/components/admin/data-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ComboboxFilter } from '@/components/admin/combobox-filter';
import { FilterBar } from '@/components/admin/filter-bar';
import { contactColumns } from '../columns';
import type { Contact } from '../types';
import { deleteContact } from '../actions/delete-contact';
import { ContactViewModal } from './contact-view-modal';
import { ContactFormModal } from './contact-form-modal';

const PAGE_SIZE = 25;

const ROLES = [
  'Decision Maker', 'Influencer', 'Champion', 'Sponsor', 'Steerco Lid',
  'Technisch', 'Financieel', 'Operationeel', 'Contact',
] as const;

export type AccountOption = { id: string; name: string };

type ContactListProps = {
  initialData?: Contact[];
  initialCount?: number;
  accounts?: AccountOption[];
};

export function ContactList({ initialData, initialCount, accounts = [] }: ContactListProps) {
  const [viewId, setViewId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editFromView, setEditFromView] = useState(false);
  const { data, total, loading, refreshing, fetchList } = useEntity<Contact>({
    table: 'contacts',
    select: '*, account:accounts!account_id(id, name)',
    pageSize: PAGE_SIZE,
    initialData,
    initialCount,
  });

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [steercoOnly, setSteercoOnly] = useState(false);

  const load = useCallback(() => {
    const eqFilters: Record<string, string | boolean> = {};
    if (accountFilter !== 'all') eqFilters.account_id = accountFilter;
    if (roleFilter !== 'all' && roleFilter !== 'Steerco Lid') eqFilters.role = roleFilter;
    if (steercoOnly || roleFilter === 'Steerco Lid') eqFilters.is_steerco = true;

    // Multi-word search: each word must match at least one of first_name, last_name, or email
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const applyFilters = search ? (query: any) => {
      const words = search.trim().split(/\s+/).filter(Boolean);
      for (const word of words) {
        query = query.or(`first_name.ilike.%${word}%,last_name.ilike.%${word}%,email.ilike.%${word}%`);
      }
      return query;
    } : undefined;

    fetchList({ page, eqFilters, applyFilters });
  }, [fetchList, page, search, accountFilter, roleFilter, steercoOnly]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [accountFilter, roleFilter, steercoOnly, search]);

  const handleDelete = async (id: string) => {
    const result = await deleteContact(id);
    if (result.success) {
      toast.success('Contact verwijderd');
      load();
    } else {
      toast.error(typeof result.error === 'string' ? result.error : 'Er ging iets mis');
    }
  };

  return (
    <div className="space-y-4">
      <FilterBar>
        <div className="flex items-center gap-3 flex-wrap">
          <Input
            placeholder="Zoeken op naam of e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          {accounts.length > 0 && (
            <ComboboxFilter
              options={accounts.map((a) => ({ value: a.id, label: a.name }))}
              value={accountFilter}
              onValueChange={setAccountFilter}
              placeholder="Alle accounts"
              searchPlaceholder="Zoek account..."
              className="w-48"
            />
          )}
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v ?? 'all')}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle rollen</SelectItem>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={steercoOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSteercoOnly((prev) => !prev)}
          >
            Steerco
          </Button>
        </div>
      </FilterBar>
      <DataTable
        columns={contactColumns as any}
        data={data}
        pagination={{ page, pageSize: PAGE_SIZE, total }}
        onPageChange={setPage}
        loading={loading}
        refreshing={refreshing}
        rowActions={(row) => [
          { icon: Eye, label: 'Bekijken', onClick: () => setViewId(row.id) },
          { icon: Pencil, label: 'Bewerken', onClick: () => setEditId(row.id) },
          { icon: Trash2, label: 'Verwijderen', variant: 'destructive' as const, confirm: { title: 'Contact verwijderen?', description: 'Dit verwijdert het contact permanent.' }, onClick: () => handleDelete(row.id) },
        ]}
        bulkActions={[
          { label: 'Verwijderen', variant: 'destructive' as const, confirm: { title: 'Contacten verwijderen?', description: 'Dit verwijdert de geselecteerde contacten permanent.' }, action: (ids) => ids.forEach((id) => handleDelete(id)) },
        ]}
      />
      <ContactViewModal
        contactId={viewId}
        onClose={() => setViewId(null)}
        onEdit={(id) => { setViewId(null); setEditId(id); setEditFromView(true); }}
      />
      <ContactFormModal
        contactId={editId}
        accountId={data.find((r) => r.id === editId)?.account_id ?? ''}
        open={editId !== null}
        onClose={() => { const id = editId; setEditId(null); if (editFromView) { setViewId(id); setEditFromView(false); } }}
        onSaved={() => { const id = editId; setEditId(null); if (editFromView) { setViewId(id); setEditFromView(false); } load(); }}
      />
    </div>
  );
}
