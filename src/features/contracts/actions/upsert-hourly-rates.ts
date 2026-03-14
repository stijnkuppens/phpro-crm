'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { ok, err, type ActionResult } from '@/lib/action-result';

export async function upsertHourlyRates(
  accountId: string,
  year: number,
  rates: { role: string; rate: number }[],
): Promise<ActionResult<void>> {
  await requirePermission('contracts.write');

  const supabase = await createServerClient();

  const { error: deleteError } = await supabase
    .from('hourly_rates')
    .delete()
    .eq('account_id', accountId)
    .eq('year', year);

  if (deleteError) {
    return err(deleteError.message);
  }

  if (rates.length > 0) {
    const { error: insertError } = await supabase
      .from('hourly_rates')
      .insert(rates.map((r) => ({ account_id: accountId, year, role: r.role, rate: r.rate })));

    if (insertError) {
      return err(insertError.message);
    }
  }

  await logAction({
    action: 'hourly_rates.upserted',
    entityType: 'account',
    entityId: accountId,
    metadata: { year, count: rates.length },
  });

  revalidatePath(`/admin/accounts/${accountId}`);
  return ok();
}
