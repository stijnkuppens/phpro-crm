'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { ok, err, type ActionResult } from '@/lib/action-result';

type PrognoseEntry = {
  revenue_client_id: string;
  division_id: string;
  service_name: string;
  amount: number;
};

export async function savePrognose(year: number, entries: PrognoseEntry[]): Promise<ActionResult> {
  await requirePermission('revenue.write');
  const supabase = await createServerClient();
  const clientIds = [...new Set(entries.map((e) => e.revenue_client_id))];
  if (clientIds.length > 0) {
    await supabase.from('revenue_entries').delete().in('revenue_client_id', clientIds).eq('year', year);
  }
  const rows: { revenue_client_id: string; division_id: string; service_name: string; year: number; month: number; amount: number }[] = [];
  for (const entry of entries) {
    if (entry.amount <= 0) continue;
    const monthlyAmount = Math.round(entry.amount / 12);
    const remainder = entry.amount - monthlyAmount * 12;
    for (let m = 0; m < 12; m++) {
      rows.push({ revenue_client_id: entry.revenue_client_id, division_id: entry.division_id, service_name: entry.service_name, year, month: m, amount: monthlyAmount + (m === 0 ? remainder : 0) });
    }
  }
  if (rows.length > 0) {
    const { error } = await supabase.from('revenue_entries').insert(rows);
    if (error) return err(error.message);
  }
  await logAction({ action: 'prognose.saved', entityType: 'revenue_entries', metadata: { year, entry_count: entries.length } });
  revalidatePath('/admin/prognose');
  return ok();
}
