'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { ok, err, type ActionResult } from '@/lib/action-result';

export async function upsertRevenueEntry(
  revenueClientId: string,
  divisionId: string,
  serviceName: string,
  year: number,
  month: number,
  amount: number,
): Promise<ActionResult> {
  try {
    await requirePermission('revenue.write');
  } catch {
    return err('Onvoldoende rechten');
  }
  const supabase = await createServerClient();
  const { error } = await supabase
    .from('revenue_entries')
    .upsert(
      { revenue_client_id: revenueClientId, division_id: divisionId, service_name: serviceName, year, month, amount },
      { onConflict: 'revenue_client_id,division_id,service_name,year,month' },
    );
  if (error) return err(error.message);
  await logAction({ action: 'revenue_entry.upserted', entityType: 'revenue_entry', entityId: `${revenueClientId}:${year}:${month}`, metadata: { division_id: divisionId, service_name: serviceName, amount } });
  revalidatePath('/admin/revenue');
  return ok();
}
