'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useQueryState, parseAsInteger, parseAsBoolean } from 'nuqs';
import { Plus, SquarePen, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEntity } from '@/lib/hooks/use-entity';
import DataTable from '@/components/admin/data-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ComboboxFilter } from '@/components/admin/combobox-filter';
import { PageHeader } from '@/components/admin/page-header';
import { ExportDropdown } from '@/components/admin/export-dropdown';
import { contactExportColumns } from '../export-columns';
import { Avatar } from '@/components/admin/avatar';
import { StatusBadge } from '@/components/admin/status-badge';
import { contactColumns } from '../columns';
import type { ContactWithDetails } from '../types';
import dynamic from 'next/dynamic';
import { deleteContact } from '../actions/delete-contact';

const ContactViewModal = dynamic(() => import('./contact-view-modal').then(m => ({ default: m.ContactViewModal })), { ssr: false });
const ContactFormModal = dynamic(() => import('./contact-form-modal').then(m => ({ default: m.ContactFormModal })), { ssr: false });
import { escapeSearch } from '@/lib/utils/escape-search';

const PAGE_SIZE = 25;

const ROLES = [
  'Decision Maker', 'Influencer', 'Champion', 'Sponsor', 'Steerco Lid',
  'Technisch', 'Financieel', 'Operationeel', 'Contact',
] as const;

export type AccountOption = { id: string; name: string };

type ContactListProps = {
  initialData?: ContactWithDetails[];
  initialCount?: number;
  accounts?: AccountOption[];
};

export function ContactList({ initialData, initialCount, accounts = [] }: ContactListProps) {
  const [viewId, setViewId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editFromView, setEditFromView] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const { data, total, loading, refreshing, fetchList } = useEntity<ContactWithDetails>({
    table: 'contacts',
    select: '*, account:accounts!account_id(id, name)',
    pageSize: PAGE_SIZE,
    initialData,
    initialCount,
  });

  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState('q', { defaultValue: '' });
  const [accountFilter, setAccountFilter] = useQueryState('account', { defaultValue: 'all' });
  const [roleFilter, setRoleFilter] = useQueryState('role', { defaultValue: 'all' });
  const [steercoOnly, setSteercoOnly] = useQueryState('steerco', parseAsBoolean.withDefault(false));
  const isInitialMount = useRef(true);

  const load = useCallback(() => {
    const eqFilters: Record<string, string | boolean> = {};
    if (accountFilter !== 'all') eqFilters.account_id = accountFilter;
    if (roleFilter !== 'all' && roleFilter !== 'Steerco Lid') eqFilters.role = roleFilter;
    if (steercoOnly || roleFilter === 'Steerco Lid') eqFilters.is_steerco = true;

    // Multi-word search: each word must match at least one of first_name, last_name, or email
    const applyFilters = search ? (query: any) => {
      const words = search.trim().split(/\s+/).filter(Boolean);
      for (const word of words) {
        const w = escapeSearch(word);
        query = query.or(`first_name.ilike.%${w}%,last_name.ilike.%${w}%,email.ilike.%${w}%`);
      }
      return query;
    } : undefined;

    fetchList({ page, eqFilters, applyFilters });
  }, [fetchList, page, search, accountFilter, roleFilter, steercoOnly]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    load();
  }, [load]);

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
    <div className="space-y-6">
      <PageHeader
        title="Contacts"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Contacts' },
        ]}
        actions={
          <div className="flex gap-2">
            <ExportDropdown
              entity="contacts"
              columns={contactExportColumns}
              filters={{ sort: { column: 'last_name', direction: 'asc' } }}
            />
            <Button size="sm" onClick={() => setShowNew(true)}>
              <Plus />
              Nieuw contact
            </Button>
          </div>
        }
      />
      <DataTable
        tableId="contacts"
        filterBar={
          <div className="flex items-center gap-3 flex-wrap">
            <Input
              placeholder="Zoeken op naam of e-mail..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full sm:w-64"
            />
            {accounts.length > 0 && (
              <ComboboxFilter
                options={accounts.map((a) => ({ value: a.id, label: a.name }))}
                value={accountFilter}
                onValueChange={(v) => { setAccountFilter(v); setPage(1); }}
                placeholder="Alle accounts"
                searchPlaceholder="Zoek account..."
                className="w-48"
              />
            )}
            <ComboboxFilter
              options={ROLES.map((r) => ({ value: r, label: r }))}
              value={roleFilter}
              onValueChange={(v) => { setRoleFilter(v); setPage(1); }}
              placeholder="Alle rollen"
              searchPlaceholder="Zoek rol..."
              className="w-48"
            />
            <Button
              variant={steercoOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setSteercoOnly((prev) => !prev); setPage(1); }}
            >
              Steerco
            </Button>
          </div>
        }
        columns={contactColumns}
        data={data}
        onRowClick={(row) => setViewId(row.id)}
        pagination={{ page, pageSize: PAGE_SIZE, total }}
        onPageChange={setPage}
        loading={loading}
        refreshing={refreshing}
        renderMobileCard={(row) => {
          const name = `${row.first_name} ${row.last_name}`;
          const initials = `${row.first_name[0] ?? ''}${row.last_name[0] ?? ''}`.toUpperCase();
          return (
            <div className="flex flex-col gap-1 py-1">
              <div className="flex items-center gap-3">
                <Avatar path={row.avatar_url ?? null} fallback={initials} size="sm" round />
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium text-sm truncate">{name}</span>
                  {row.is_steerco && (
                    <StatusBadge positive>Steerco</StatusBadge>
                  )}
                </div>
              </div>
              {row.title && (
                <span className="text-sm text-foreground pl-10">{row.title}</span>
              )}
              {row.account?.name && (
                <span className="text-xs text-muted-foreground pl-10">{row.account.name}</span>
              )}
              {row.email && (
                <span className="text-xs text-muted-foreground pl-10 truncate">{row.email}</span>
              )}
            </div>
          );
        }}
        rowActions={(row) => [
          { icon: SquarePen, label: 'Bewerken', onClick: () => setEditId(row.id) },
          { icon: Trash2, label: 'Verwijderen', variant: 'destructive' as const, confirm: { title: 'Contact verwijderen?', description: 'Dit verwijdert het contact permanent.' }, onClick: () => handleDelete(row.id) },
        ]}
        bulkActions={[
          { label: 'Verwijderen', variant: 'destructive' as const, confirm: { title: 'Contacten verwijderen?', description: 'Dit verwijdert de geselecteerde contacten permanent.' }, action: (ids) => ids.forEach((id) => handleDelete(id)) },
        ]}
      />
      {viewId && (
        <ContactViewModal
          key={viewId}
          contactId={viewId}
          onClose={() => setViewId(null)}
          onEdit={(id) => { setViewId(null); setEditId(id); setEditFromView(true); }}
        />
      )}
      {editId && (
        <ContactFormModal
          key={editId}
          contactId={editId}
          accountId={data.find((r) => r.id === editId)?.account_id ?? ''}
          open
          onClose={() => { const id = editId; setEditId(null); if (editFromView) { setViewId(id); setEditFromView(false); } }}
          onSaved={() => { const id = editId; setEditId(null); if (editFromView) { setViewId(id); setEditFromView(false); } load(); }}
        />
      )}
      {showNew && (
        <ContactFormModal
          key="new"
          contactId={null}
          accounts={accounts}
          open
          onClose={() => setShowNew(false)}
          onSaved={() => { setShowNew(false); load(); }}
        />
      )}
    </div>
  );
}
