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
  try {
    await requirePermission('contracts.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  const supabase = await createServerClient();

  const { error: rpcError } = await supabase.rpc('upsert_hourly_rates', {
    p_account_id: accountId,
    p_year: year,
    p_rates: rates,
  });

  if (rpcError) {
    return err(rpcError.message);
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
