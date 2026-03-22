'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Pencil, Plus, X, Check } from 'lucide-react';
import { createAccountRevenue, updateAccountRevenue, deleteAccountRevenue } from '../actions/manage-account-revenue';
import type { AccountRevenue, AccountRevenueFormValues } from '../types';
import { formatEUR } from '@/lib/format';

type Props = {
  accountId: string;
  initialData: AccountRevenue[];
};

export function OmzetTab({ accountId, initialData }: Props) {
  const [data, setData] = useState(initialData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<AccountRevenueFormValues>({ year: new Date().getFullYear(), category: '', amount: 0 });
  const [adding, setAdding] = useState(false);
  const [newValues, setNewValues] = useState<AccountRevenueFormValues>({ year: new Date().getFullYear(), category: '', amount: 0 });

  const grouped = data.reduce<Record<number, AccountRevenue[]>>((acc, r) => {
    (acc[r.year] ??= []).push(r);
    return acc;
  }, {});
  const years = Object.keys(grouped).map(Number).sort((a, b) => b - a);

  async function handleCreate() {
    const result = await createAccountRevenue(accountId, newValues);
    if (result.success && result.data) {
      setData((prev) => [{ id: result.data!.id, account_id: accountId, ...newValues, notes: newValues.notes ?? null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as AccountRevenue, ...prev]);
      setAdding(false);
      setNewValues({ year: new Date().getFullYear(), category: '', amount: 0 });
    }
  }

  async function handleUpdate(id: string) {
    const result = await updateAccountRevenue(id, editValues);
    if (result.success) {
      setData((prev) => prev.map((r) => r.id === id ? { ...r, ...editValues } as AccountRevenue : r));
      setEditingId(null);
    }
  }

  async function handleDelete(id: string) {
    const result = await deleteAccountRevenue(id);
    if (result.success) {
      setData((prev) => prev.filter((r) => r.id !== id));
    }
  }

  if (data.length === 0 && !adding) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground mb-4">Geen omzet geregistreerd.</p>
        <Button size="sm" onClick={() => setAdding(true)}><Plus className="h-4 w-4 mr-1" /> Toevoegen</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setAdding(true)} disabled={adding}>
          <Plus className="h-4 w-4 mr-1" /> Toevoegen
        </Button>
      </div>

      {adding && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex gap-2 items-end">
              <div>
                <label className="text-xs text-muted-foreground">Jaar</label>
                <Input type="number" value={newValues.year} onChange={(e) => setNewValues({ ...newValues, year: Number(e.target.value) })} className="w-24" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Categorie</label>
                <Input value={newValues.category} onChange={(e) => setNewValues({ ...newValues, category: e.target.value })} className="w-40" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Bedrag</label>
                <Input type="number" value={newValues.amount} onChange={(e) => setNewValues({ ...newValues, amount: Number(e.target.value) })} className="w-32" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Notities</label>
                <Input value={newValues.notes ?? ''} onChange={(e) => setNewValues({ ...newValues, notes: e.target.value })} className="w-48" />
              </div>
              <Button size="sm" onClick={handleCreate}><Check className="h-4 w-4" /></Button>
              <Button size="sm" variant="ghost" onClick={() => setAdding(false)}><X className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      )}

      {years.map((year) => (
        <Card key={year}>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">{year}</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Categorie</th>
                  <th className="text-right p-2">Bedrag</th>
                  <th className="text-left p-2">Notities</th>
                  <th className="w-20"></th>
                </tr>
              </thead>
              <tbody>
                {grouped[year].map((r) => (
                  <tr key={r.id} className="border-b">
                    {editingId === r.id ? (
                      <>
                        <td className="p-2"><Input value={editValues.category} onChange={(e) => setEditValues({ ...editValues, category: e.target.value })} className="w-40" /></td>
                        <td className="p-2 text-right"><Input type="number" value={editValues.amount} onChange={(e) => setEditValues({ ...editValues, amount: Number(e.target.value) })} className="w-32 text-right" /></td>
                        <td className="p-2"><Input value={editValues.notes ?? ''} onChange={(e) => setEditValues({ ...editValues, notes: e.target.value })} /></td>
                        <td className="p-2 text-right">
                          <Button size="sm" variant="ghost" onClick={() => handleUpdate(r.id)}><Check className="h-3 w-3" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><X className="h-3 w-3" /></Button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-2 font-medium">{r.category}</td>
                        <td className="p-2 text-right tabular-nums">{formatEUR(Number(r.amount))}</td>
                        <td className="p-2 text-muted-foreground">{r.notes}</td>
                        <td className="p-2 text-right">
                          <Button size="sm" variant="ghost" onClick={() => { setEditingId(r.id); setEditValues({ year: r.year, category: r.category, amount: Number(r.amount), notes: r.notes ?? '' }); }}><Pencil className="h-3 w-3" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(r.id)}><Trash2 className="h-3 w-3" /></Button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
