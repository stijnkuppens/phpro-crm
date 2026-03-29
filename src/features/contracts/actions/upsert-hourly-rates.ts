'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { ok, err, type ActionResult } from '@/lib/action-result';
import { upsertHourlyRatesSchema } from '@/features/contracts/types';

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

  const parsed = upsertHourlyRatesSchema.safeParse({ accountId, year, rates });
  if (!parsed.success) return err('Ongeldige invoer');

  const supabase = await createServerClient();
  const { data: before } = await supabase.from('hourly_rates').select('*').eq('account_id', accountId).eq('year', year);

  const { error: rpcError } = await supabase.rpc('upsert_hourly_rates', {
    p_account_id: accountId,
    p_year: year,
    p_rates: rates,
  });

  if (rpcError) {
    console.error('[upsertHourlyRates]', rpcError);
    return err('Er is een fout opgetreden');
  }

  await logAction({
    action: 'hourly_rates.upserted',
    entityType: 'account',
    entityId: accountId,
    metadata: { year, count: rates.length, before, after: rates },
  });

  revalidatePath(`/admin/accounts/${accountId}`);
  return ok();
}
