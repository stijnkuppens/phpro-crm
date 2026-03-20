'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { contactColumns } from '../columns';
import type { Contact } from '../types';
import { deleteContact } from '../actions/delete-contact';

const PAGE_SIZE = 25;

const ROLES = [
  'Decision Maker', 'Influencer', 'Champion', 'Sponsor', 'Steerco Lid',
  'Technisch', 'Financieel', 'Operationeel', 'Contact',
] as const;

type ContactListProps = {
  initialData?: Contact[];
  initialCount?: number;
};

export function ContactList({ initialData, initialCount }: ContactListProps) {
  const router = useRouter();
  const { data, total, loading, fetchList } = useEntity<Contact>({
    table: 'contacts',
    pageSize: PAGE_SIZE,
    initialData,
    initialCount,
  });

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [steercoOnly, setSteercoOnly] = useState(false);

  const load = useCallback(() => {
    const orFilter = search
      ? `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
      : undefined;

    const eqFilters: Record<string, string | boolean> = {};
    if (roleFilter !== 'all' && roleFilter !== 'Steerco Lid') eqFilters.role = roleFilter;
    if (steercoOnly || roleFilter === 'Steerco Lid') eqFilters.is_steerco = true;

    fetchList({ page, orFilter, eqFilters });
  }, [fetchList, page, search, roleFilter, steercoOnly]);

  useEffect(() => {
    if (initialData && page === 1 && !search && roleFilter === 'all' && !steercoOnly) return;
    load();
  }, [load, initialData, page, search, roleFilter, steercoOnly]);

  useEffect(() => {
    setPage(1);
  }, [roleFilter, steercoOnly, search]);

  const handleDelete = async (id: string) => {
    const result = await deleteContact(id);
    if (result.success) {
      toast.success('Contact verwijderd');
      load();
    } else {
      toast.error(result.error as string);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Input
          placeholder="Zoeken op naam of e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
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
      <DataTable
        columns={contactColumns as any}
        data={data}
        pagination={{ page, pageSize: PAGE_SIZE, total }}
        onPageChange={setPage}
        loading={loading}
        rowActions={(row) => [
          { icon: Eye, label: 'Bekijken', onClick: () => router.push(`/admin/accounts/${row.account_id}`) },
          { icon: Pencil, label: 'Bewerken', onClick: () => router.push(`/admin/accounts/${row.account_id}`) },
          { icon: Trash2, label: 'Verwijderen', variant: 'destructive' as const, confirm: { title: 'Contact verwijderen?', description: 'Dit verwijdert het contact permanent.' }, onClick: () => handleDelete(row.id) },
        ]}
        bulkActions={[
          { label: 'Verwijderen', variant: 'destructive' as const, confirm: { title: 'Contacten verwijderen?', description: 'Dit verwijdert de geselecteerde contacten permanent.' }, action: (ids) => ids.forEach((id) => handleDelete(id)) },
        ]}
      />
    </div>
  );
}
