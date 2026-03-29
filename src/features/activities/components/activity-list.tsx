'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Activity as ActivityIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useEntity } from '@/lib/hooks/use-entity';
import { ListPageToolbar } from '@/components/admin/list-page-toolbar';
import { FilterBar } from '@/components/admin/filter-bar';
import { FilterPill } from '@/components/admin/filter-pill';
import { EmptyState } from '@/components/admin/empty-state';
import { Modal } from '@/components/admin/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { ActivityForm } from './activity-form';
import { updateActivity } from '../actions/update-activity';
import { deleteActivity } from '../actions/delete-activity';
import { ActivityCardList } from './activity-card-list';
import { escapeSearch } from '@/lib/utils/escape-search';
import type { ActivityWithRelations, ActivityFormValues } from '../types';

const STATUS_PILLS = [
  { value: 'all', label: 'Alle' },
  { value: 'false', label: 'Gepland' },
  { value: 'true', label: 'Afgerond' },
];

const PAGE_SIZE = 25;

const ACTIVITY_SELECT = `
  *,
  account:accounts!account_id(id, name),
  deal:deals!deal_id(id, title),
  owner:user_profiles!owner_id(id, full_name)
`;

type Props = {
  initialData: ActivityWithRelations[];
  initialCount: number;
  accounts?: { id: string; name: string }[];
};

export function ActivityList({ initialData, initialCount, accounts = [] }: Props) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ActivityWithRelations | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const isInitialMount = useRef(true);

  const { data, total, fetchList } = useEntity<ActivityWithRelations>({
    table: 'activities',
    select: ACTIVITY_SELECT,
    pageSize: PAGE_SIZE,
    initialData,
    initialCount,
  });

  const load = useCallback(() => {
    const escaped = escapeSearch(search);
    const orFilter = search ? `subject.ilike.%${escaped}%` : undefined;
    const eqFilters: Record<string, string> = {};
    if (statusFilter !== 'all') {
      eqFilters.is_done = statusFilter;
    }

    fetchList({
      page,
      sort: { column: 'date', direction: 'desc' },
      orFilter,
      eqFilters: Object.keys(eqFilters).length > 0 ? eqFilters : undefined,
    });
  }, [fetchList, page, search, statusFilter]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  async function handleToggleDone(activity: ActivityWithRelations) {
    const values: ActivityFormValues = {
      type: activity.type as ActivityFormValues['type'],
      subject: activity.subject,
      date: activity.date,
      duration_minutes: activity.duration_minutes,
      account_id: activity.account_id,
      deal_id: activity.deal_id,
      notes: activity.notes,
      is_done: !activity.is_done,
    };

    const result = await updateActivity(activity.id, values);
    if ('error' in result && result.error) {
      toast.error('Kon status niet bijwerken');
    } else {
      load();
    }
  }

  async function handleDelete(id: string) {
    const result = await deleteActivity(id);
    if (result.success) {
      toast.success('Activiteit verwijderd');
      load();
    } else {
      toast.error('Kon activiteit niet verwijderen');
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <>
      <div className="space-y-6">
        <ListPageToolbar
          actions={
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <Plus /> Nieuwe activiteit
            </Button>
          }
        />

        <FilterBar>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Zoek activiteiten..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-48 pl-9"
                />
              </div>
            </div>
            <div className="flex gap-1.5">
              {STATUS_PILLS.map((pill) => (
                <FilterPill
                  key={pill.value}
                  label={pill.label}
                  active={statusFilter === pill.value}
                  onClick={() => setStatusFilter(pill.value)}
                />
              ))}
            </div>
          </div>
        </FilterBar>

        <ActivityCardList
          activities={data}
          showAccount
          onToggleDone={handleToggleDone}
          onEdit={setEditTarget}
          onDelete={handleDelete}
          emptyIcon={ActivityIcon}
          emptyAction={{ label: 'Nieuwe activiteit', onClick: () => setModalOpen(true) }}
        />

        {totalPages > 1 && (
          <div className="flex items-center justify-between rounded-xl border bg-card shadow-sm px-4 py-3">
            <span className="text-xs text-muted-foreground">{total} activiteiten</span>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage(Math.max(1, page - 1))}
                    className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                {(() => {
                  const maxVisible = 5;
                  let start = Math.max(1, page - Math.floor(maxVisible / 2));
                  const end = Math.min(totalPages, start + maxVisible - 1);
                  start = Math.max(1, end - maxVisible + 1);
                  return Array.from({ length: end - start + 1 }, (_, i) => start + i).map((p) => (
                    <PaginationItem key={p}>
                      <PaginationLink
                        onClick={() => setPage(p)}
                        isActive={p === page}
                        className="cursor-pointer"
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  ));
                })()}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {modalOpen && (
        <Modal open onClose={() => setModalOpen(false)} title="Nieuwe activiteit" size="wide">
          <ActivityForm
            accounts={accounts}
            onSuccess={() => {
              setModalOpen(false);
              load();
              router.refresh();
            }}
            onCancel={() => setModalOpen(false)}
          />
        </Modal>
      )}

      {editTarget && (
        <Modal key={editTarget.id} open onClose={() => setEditTarget(null)} title="Activiteit bewerken" size="wide">
          <ActivityForm
            defaultValues={{
              id: editTarget.id,
              type: editTarget.type as ActivityFormValues['type'],
              subject: editTarget.subject,
              date: editTarget.date,
              duration_minutes: editTarget.duration_minutes,
              account_id: editTarget.account_id,
              deal_id: editTarget.deal_id,
              notes: editTarget.notes,
              is_done: editTarget.is_done ?? false,
            }}
            accounts={accounts}
            onSuccess={() => {
              setEditTarget(null);
              load();
              router.refresh();
            }}
            onCancel={() => setEditTarget(null)}
          />
        </Modal>
      )}
    </>
  );
}
