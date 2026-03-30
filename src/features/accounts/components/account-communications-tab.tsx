'use client';

import { Plus, SquarePen, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import DataTable from '@/components/admin/data-table';
import type { FilterOption } from '@/components/admin/data-table-filters';
import { buildFilterQuery, DataTableFilters } from '@/components/admin/data-table-filters';
import { ListPageToolbar } from '@/components/admin/list-page-toolbar';
import { Button } from '@/components/ui/button';
import { deleteCommunication } from '@/features/communications/actions/delete-communication';
import { communicationColumns } from '@/features/communications/columns';
import { CommunicationDetailModal } from '@/features/communications/components/communication-detail-modal';
import { CommunicationModal } from '@/features/communications/components/communication-modal';
import type { COMMUNICATION_TYPE_CONFIG, CommunicationWithDetails } from '@/features/communications/types';
import { useEntity } from '@/lib/hooks/use-entity';

type CommType = keyof typeof COMMUNICATION_TYPE_CONFIG;

type Props = {
  accountId: string;
  initialData: CommunicationWithDetails[];
  initialCount: number;
  contacts?: { id: string; first_name: string; last_name: string }[];
  deals?: { id: string; title: string }[];
};

const COMM_SELECT = `
  *,
  contact:contacts!contact_id(id, first_name, last_name),
  deal:deals!deal_id(id, title),
  owner:user_profiles!owner_id(id, full_name)
`;

const PAGE_SIZE = 25;

const TYPE_PILLS: { value: CommType | null; label: string }[] = [
  { value: null, label: 'Alles' },
  { value: 'email', label: 'E-mail' },
  { value: 'note', label: 'Notitie' },
  { value: 'meeting', label: 'Vergadering' },
  { value: 'call', label: 'Call' },
];

export function AccountCommunicationsTab({ accountId, initialData, initialCount, contacts = [], deals = [] }: Props) {
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState<CommType | null>(null);
  const [filters, setFilters] = useState<Record<string, string | undefined>>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [viewRow, setViewRow] = useState<CommunicationWithDetails | null>(null);
  const [editRow, setEditRow] = useState<CommunicationWithDetails | null>(null);
  const [page, setPage] = useState(1);
  const isInitialMount = useRef(true);

  const { data, total, loading, refreshing, fetchList } = useEntity<CommunicationWithDetails>({
    table: 'communications',
    select: COMM_SELECT,
    pageSize: PAGE_SIZE,
    initialData,
    initialCount,
  });

  const filterOptions: Record<string, FilterOption[]> = {
    contact_id: contacts.map((c) => ({
      value: c.id,
      label: `${c.first_name} ${c.last_name}`,
    })),
    deal_id: deals.map((d) => ({ value: d.id, label: d.title })),
    owner_id: Array.from(
      new Map(initialData.filter((c) => c.owner?.id).map((c) => [c.owner!.id, c.owner!.full_name ?? 'Onbekend'])),
    ).map(([id, name]) => ({ value: id, label: name })),
  };

  const load = useCallback(() => {
    const { orFilter, eqFilters: autoFilters } = buildFilterQuery(communicationColumns, filters);
    const eqFilters: Record<string, string> = { ...autoFilters, account_id: accountId };
    if (typeFilter) eqFilters.type = typeFilter;

    fetchList({
      page,
      sort: { column: 'date', direction: 'desc' },
      orFilter,
      eqFilters,
    });
  }, [fetchList, page, accountId, typeFilter, filters]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    load();
  }, [load]);

  const handleFilterChange = useCallback((newFilters: Record<string, string | undefined>) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  useEffect(() => {
    setPage(1);
  }, []);

  const handleClose = useCallback(() => {
    setCreateOpen(false);
    setEditRow(null);
    setViewRow(null);
    load();
    router.refresh();
  }, [load, router]);

  const handleDelete = async (id: string) => {
    const result = await deleteCommunication(id);
    if (result.error) {
      toast.error(typeof result.error === 'string' ? result.error : 'Verwijderen mislukt');
    } else {
      toast.success('Communicatie verwijderd');
      load();
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <ListPageToolbar
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus /> Nieuw
          </Button>
        }
      />
      <DataTable
        tableId="account-communications"
        filterBar={
          <div className="flex flex-col gap-3">
            <DataTableFilters
              columns={communicationColumns}
              filters={filters}
              onFilterChange={handleFilterChange}
              filterOptions={filterOptions}
            />
            <div className="flex gap-1.5">
              {TYPE_PILLS.map((pill) => (
                <button
                  key={pill.label}
                  type="button"
                  onClick={() => setTypeFilter(pill.value)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                    typeFilter === pill.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>
        }
        columns={communicationColumns}
        data={data}
        initialSorting={[{ id: 'date', desc: true }]}
        onRowClick={(row) => setViewRow(row)}
        pagination={{ page, pageSize: PAGE_SIZE, total }}
        onPageChange={setPage}
        loading={loading}
        refreshing={refreshing}
        rowActions={(row) => [
          { icon: SquarePen, label: 'Bewerken', onClick: () => setEditRow(row) },
          {
            icon: Trash2,
            label: 'Verwijderen',
            variant: 'destructive' as const,
            confirm: {
              title: 'Communicatie verwijderen?',
              description: 'Dit verwijdert de communicatie permanent.',
            },
            onClick: () => handleDelete(row.id),
          },
        ]}
        renderMobileCard={(row) => (
          <div className="space-y-1 py-1">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium">{row.type}</span>
              <span className="truncate font-medium text-sm">{row.subject}</span>
            </div>
            {row.contact && (
              <div className="text-xs text-muted-foreground">
                {row.contact.first_name} {row.contact.last_name}
              </div>
            )}
            <div className="text-[11px] text-muted-foreground">
              {new Date(row.date).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        )}
      />

      {/* Detail modal — row click */}
      {viewRow && (
        <CommunicationDetailModal
          key={viewRow.id}
          communication={viewRow}
          onClose={() => setViewRow(null)}
          onEdit={() => {
            setEditRow(viewRow);
            setViewRow(null);
          }}
        />
      )}

      {/* Edit modal — from detail or row action */}
      {editRow && (
        <CommunicationModal
          key={`edit-${editRow.id}`}
          open
          onClose={handleClose}
          accountId={accountId}
          contacts={contacts}
          deals={deals}
          defaultValues={{
            id: editRow.id,
            type: editRow.type as 'email' | 'note' | 'meeting' | 'call',
            subject: editRow.subject,
            to: editRow.to,
            date: editRow.date,
            duration_minutes: editRow.duration_minutes,
            contact_id: editRow.contact_id,
            deal_id: editRow.deal_id,
            content: editRow.content,
            is_done: editRow.is_done,
          }}
        />
      )}

      {/* Create modal */}
      {createOpen && (
        <CommunicationModal
          key="new"
          open
          onClose={handleClose}
          accountId={accountId}
          contacts={contacts}
          deals={deals}
        />
      )}
    </div>
  );
}
