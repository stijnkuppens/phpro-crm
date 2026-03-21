'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { createBrowserClient } from '@/lib/supabase/client';
import { AvatarUpload } from '@/components/admin/avatar-upload';
import { Avatar } from '@/components/admin/avatar';
import { REF_TABLES, type RefTableKey, type ReferenceItem, type RefItemFormValues } from '../types';
import { Save } from 'lucide-react';
import {
  createReferenceItem,
  updateReferenceItem,
  deleteReferenceItem,
} from '../actions/manage-reference-items';

type Props = {
  initialTable: RefTableKey;
  initialData: ReferenceItem[];
};

export function ReferenceDataPage({ initialTable, initialData }: Props) {
  const [selectedTable, setSelectedTable] = useState<RefTableKey>(initialTable);
  const [items, setItems] = useState<ReferenceItem[]>(initialData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<RefItemFormValues>({ name: '', sort_order: 0, is_active: true });
  const [showAdd, setShowAdd] = useState(false);
  const [addValues, setAddValues] = useState<RefItemFormValues>({ name: '', sort_order: 0, is_active: true });
  const [isPending, startTransition] = useTransition();

  async function fetchItems(table: RefTableKey) {
    const supabase = createBrowserClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from(table) as any)
      .select('id, name, sort_order, is_active, avatar_url, created_at, updated_at')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      toast.error('Fout bij het laden van gegevens');
      return;
    }
    setItems((data ?? []) as ReferenceItem[]);
  }

  function handleTableSwitch(table: RefTableKey) {
    setSelectedTable(table);
    setEditingId(null);
    setShowAdd(false);
    fetchItems(table);
  }

  function startEdit(item: ReferenceItem) {
    setEditingId(item.id);
    setEditValues({ name: item.name, sort_order: item.sort_order, is_active: item.is_active });
    setShowAdd(false);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function handleSaveEdit(id: string) {
    startTransition(async () => {
      const result = await updateReferenceItem(selectedTable, id, editValues);
      if (result.success) {
        toast.success('Item bijgewerkt');
        setEditingId(null);
        await fetchItems(selectedTable);
      } else {
        toast.error(typeof result.error === 'string' ? result.error : 'Validatiefout');
      }
    });
  }

  function handleToggleActive(item: ReferenceItem) {
    startTransition(async () => {
      const result = await updateReferenceItem(selectedTable, item.id, {
        name: item.name,
        sort_order: item.sort_order,
        is_active: !item.is_active,
      });
      if (result.success) {
        toast.success(item.is_active ? 'Item gedeactiveerd' : 'Item geactiveerd');
        await fetchItems(selectedTable);
      } else {
        toast.error(typeof result.error === 'string' ? result.error : 'Fout');
      }
    });
  }

  function handleAdd() {
    startTransition(async () => {
      const result = await createReferenceItem(selectedTable, addValues);
      if (result.success) {
        toast.success('Item toegevoegd');
        setShowAdd(false);
        setAddValues({ name: '', sort_order: 0, is_active: true });
        await fetchItems(selectedTable);
      } else {
        toast.error(typeof result.error === 'string' ? result.error : 'Validatiefout');
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteReferenceItem(selectedTable, id);
      if (result.success) {
        toast.success('Item verwijderd');
        await fetchItems(selectedTable);
      } else {
        toast.error(typeof result.error === 'string' ? result.error : 'Fout');
      }
    });
  }

  const selectedLabel = REF_TABLES.find((t) => t.key === selectedTable)?.label ?? selectedTable;
  const hasAvatar = selectedTable === 'ref_internal_people';

  return (
    <div className="flex gap-6">
      {/* Table selector sidebar */}
      <nav className="w-56 shrink-0 space-y-1">
        {REF_TABLES.map((t) => (
          <button
            key={t.key}
            onClick={() => handleTableSwitch(t.key)}
            className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
              selectedTable === t.key
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Items table */}
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{selectedLabel}</h2>
          <Button size="sm" onClick={() => { setShowAdd(true); setEditingId(null); }}>
            Toevoegen
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              {hasAvatar && <TableHead className="w-14">Foto</TableHead>}
              <TableHead>Naam</TableHead>
              <TableHead className="w-28">Volgorde</TableHead>
              <TableHead className="w-24">Actief</TableHead>
              <TableHead className="w-32">Acties</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {showAdd && (
              <TableRow>
                {hasAvatar && <TableCell />}
                <TableCell>
                  <Input
                    value={addValues.name}
                    onChange={(e) => setAddValues((v) => ({ ...v, name: e.target.value }))}
                    placeholder="Naam"
                    autoFocus
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={addValues.sort_order}
                    onChange={(e) => setAddValues((v) => ({ ...v, sort_order: parseInt(e.target.value) || 0 }))}
                    className="w-20"
                  />
                </TableCell>
                <TableCell />
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" onClick={handleAdd} disabled={isPending}>
                      <Save />
                      Opslaan
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>
                      Annuleer
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {items.map((item) => (
              <TableRow key={item.id}>
                {editingId === item.id ? (
                  <>
                    {hasAvatar && (
                      <TableCell>
                        <AvatarUpload
                          currentPath={item.avatar_url}
                          fallback={item.name.split(/\s+/).map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2)}
                          storagePath={`internal-people/${item.id}`}
                          size="sm"
                          onUploaded={async (path) => {
                            const supabase = createBrowserClient();
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            await (supabase.from('ref_internal_people') as any).update({ avatar_url: path }).eq('id', item.id);
                            setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, avatar_url: path } : i));
                          }}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <Input
                        value={editValues.name}
                        onChange={(e) => setEditValues((v) => ({ ...v, name: e.target.value }))}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={editValues.sort_order}
                        onChange={(e) => setEditValues((v) => ({ ...v, sort_order: parseInt(e.target.value) || 0 }))}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={editValues.is_active}
                        onCheckedChange={(checked) => setEditValues((v) => ({ ...v, is_active: checked }))}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" onClick={() => handleSaveEdit(item.id)} disabled={isPending}>
                          <Save />
                          Opslaan
                        </Button>
                        <Button size="sm" variant="ghost" onClick={cancelEdit}>
                          Annuleer
                        </Button>
                      </div>
                    </TableCell>
                  </>
                ) : (
                  <>
                    {hasAvatar && (
                      <TableCell>
                        <AvatarUpload
                          currentPath={item.avatar_url}
                          fallback={item.name.split(/\s+/).map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2)}
                          storagePath={`internal-people/${item.id}`}
                          size="sm"
                          onUploaded={async (path) => {
                            const supabase = createBrowserClient();
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            await (supabase.from('ref_internal_people') as any).update({ avatar_url: path }).eq('id', item.id);
                            setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, avatar_url: path } : i));
                          }}
                        />
                      </TableCell>
                    )}
                    <TableCell
                      className="cursor-pointer"
                      onClick={() => startEdit(item)}
                    >
                      {item.name}
                    </TableCell>
                    <TableCell>{item.sort_order}</TableCell>
                    <TableCell>
                      <Badge variant={item.is_active ? 'default' : 'secondary'}>
                        {item.is_active ? 'Actief' : 'Inactief'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => startEdit(item)}>
                          Bewerken
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleActive(item)}
                          disabled={isPending}
                        >
                          {item.is_active ? 'Deactiveer' : 'Activeer'}
                        </Button>
                        <ConfirmDialog
                          title="Item verwijderen?"
                          description={`Weet je zeker dat je "${item.name}" wilt verwijderen?`}
                          onConfirm={() => handleDelete(item.id)}
                          trigger={
                            <Button size="sm" variant="ghost" className="text-destructive">
                              Verwijder
                            </Button>
                          }
                        />
                      </div>
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
            {items.length === 0 && !showAdd && (
              <TableRow>
                <TableCell colSpan={hasAvatar ? 5 : 4} className="text-center text-muted-foreground py-8">
                  Geen items gevonden
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
