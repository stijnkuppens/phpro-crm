'use client';

import { Save } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { AvatarUpload } from '@/components/admin/avatar-upload';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { createBrowserClient } from '@/lib/supabase/client';
import {
  createReferenceItem,
  deleteReferenceItem,
  updateReferenceItem,
} from '../actions/manage-reference-items';
import { updateInternalPersonAvatar } from '../actions/update-internal-person-avatar';
import { REF_TABLES, type ReferenceItem, type RefItemFormValues, type RefTableKey } from '../types';

type FormMode =
  | { mode: 'idle' }
  | { mode: 'edit'; id: string; values: RefItemFormValues }
  | { mode: 'add'; values: RefItemFormValues };

type Props = {
  initialTable: RefTableKey;
  initialData: ReferenceItem[];
};

export function ReferenceDataPage({ initialTable, initialData }: Props) {
  const [selectedTable, setSelectedTable] = useState<RefTableKey>(initialTable);
  const [items, setItems] = useState<ReferenceItem[]>(initialData);
  const [formMode, setFormMode] = useState<FormMode>({ mode: 'idle' });
  const [isPending, startTransition] = useTransition();

  // Client-side fetch is intentional for tab switching: the server page passes
  // initialData for the first tab only. Subsequent tab switches fetch dynamically
  // because pre-fetching all reference tables would be wasteful.
  async function fetchItems(table: RefTableKey) {
    const supabase = createBrowserClient();
    const columns =
      table === 'ref_internal_people'
        ? 'id, name, sort_order, is_active:active, avatar_url, created_at, updated_at'
        : 'id, name, sort_order, is_active:active, created_at, updated_at';
    // biome-ignore lint/suspicious/noExplicitAny: dynamic table name returns union type that cannot be narrowed
    const { data, error } = await (supabase.from(table) as any)
      .select(columns)
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
    setFormMode({ mode: 'idle' });
    fetchItems(table);
  }

  function startEdit(item: ReferenceItem) {
    setFormMode({
      mode: 'edit',
      id: item.id,
      values: {
        name: item.name,
        sort_order: item.sort_order,
        is_active: item.is_active,
      },
    });
  }

  function cancelEdit() {
    setFormMode({ mode: 'idle' });
  }

  function handleSaveEdit(id: string) {
    if (formMode.mode !== 'edit') return;
    startTransition(async () => {
      const result = await updateReferenceItem(selectedTable, id, formMode.values);
      if (result.success) {
        toast.success('Item bijgewerkt');
        setFormMode({ mode: 'idle' });
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
    if (formMode.mode !== 'add') return;
    startTransition(async () => {
      const result = await createReferenceItem(selectedTable, formMode.values);
      if (result.success) {
        toast.success('Item toegevoegd');
        setFormMode({ mode: 'idle' });
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
            type="button"
            onClick={() => handleTableSwitch(t.key)}
            className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
              selectedTable === t.key ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
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
          <Button
            size="sm"
            onClick={() =>
              setFormMode({
                mode: 'add',
                values: { name: '', sort_order: 0, is_active: true },
              })
            }
          >
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
            {formMode.mode === 'add' && (
              <TableRow>
                {hasAvatar && <TableCell />}
                <TableCell>
                  <Input
                    value={formMode.values.name}
                    onChange={(e) =>
                      setFormMode((prev) =>
                        prev.mode === 'add'
                          ? {
                              ...prev,
                              values: { ...prev.values, name: e.target.value },
                            }
                          : prev,
                      )
                    }
                    placeholder="Naam"
                    autoFocus
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={formMode.values.sort_order}
                    onChange={(e) =>
                      setFormMode((prev) =>
                        prev.mode === 'add'
                          ? {
                              ...prev,
                              values: {
                                ...prev.values,
                                sort_order: parseInt(e.target.value, 10) || 0,
                              },
                            }
                          : prev,
                      )
                    }
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
                    <Button size="sm" variant="ghost" onClick={() => setFormMode({ mode: 'idle' })}>
                      Annuleer
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {items.map((item) => (
              <TableRow key={item.id}>
                {formMode.mode === 'edit' && formMode.id === item.id ? (
                  <>
                    {hasAvatar && (
                      <TableCell>
                        <AvatarUpload
                          currentPath={item.avatar_url}
                          fallback={item.name
                            .split(/\s+/)
                            .map((w) => w[0] ?? '')
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                          storagePath={`internal-people/${item.id}`}
                          size="sm"
                          onUploaded={async (path) => {
                            const result = await updateInternalPersonAvatar(item.id, path);
                            if (result.error) {
                              toast.error(
                                typeof result.error === 'string'
                                  ? result.error
                                  : 'Avatar bijwerken mislukt',
                              );
                              return;
                            }
                            setItems((prev) =>
                              prev.map((i) => (i.id === item.id ? { ...i, avatar_url: path } : i)),
                            );
                          }}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <Input
                        value={formMode.values.name}
                        onChange={(e) =>
                          setFormMode((prev) =>
                            prev.mode === 'edit'
                              ? {
                                  ...prev,
                                  values: {
                                    ...prev.values,
                                    name: e.target.value,
                                  },
                                }
                              : prev,
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={formMode.values.sort_order}
                        onChange={(e) =>
                          setFormMode((prev) =>
                            prev.mode === 'edit'
                              ? {
                                  ...prev,
                                  values: {
                                    ...prev.values,
                                    sort_order: parseInt(e.target.value, 10) || 0,
                                  },
                                }
                              : prev,
                          )
                        }
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={formMode.values.is_active}
                        onCheckedChange={(checked) =>
                          setFormMode((prev) =>
                            prev.mode === 'edit'
                              ? {
                                  ...prev,
                                  values: {
                                    ...prev.values,
                                    is_active: checked,
                                  },
                                }
                              : prev,
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(item.id)}
                          disabled={isPending}
                        >
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
                          fallback={item.name
                            .split(/\s+/)
                            .map((w) => w[0] ?? '')
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                          storagePath={`internal-people/${item.id}`}
                          size="sm"
                          onUploaded={async (path) => {
                            const result = await updateInternalPersonAvatar(item.id, path);
                            if (result.error) {
                              toast.error(
                                typeof result.error === 'string'
                                  ? result.error
                                  : 'Avatar bijwerken mislukt',
                              );
                              return;
                            }
                            setItems((prev) =>
                              prev.map((i) => (i.id === item.id ? { ...i, avatar_url: path } : i)),
                            );
                          }}
                        />
                      </TableCell>
                    )}
                    <TableCell className="cursor-pointer" onClick={() => startEdit(item)}>
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
            {items.length === 0 && formMode.mode !== 'add' && (
              <TableRow>
                <TableCell
                  colSpan={hasAvatar ? 5 : 4}
                  className="text-center text-muted-foreground py-8"
                >
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
