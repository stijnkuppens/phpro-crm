'use server';

import { revalidatePath } from 'next/cache';
import { logAction } from '@/features/audit/actions/log-action';
import { upsertHourlyRatesSchema } from '@/features/contracts/types';
import { type ActionResult, err, ok } from '@/lib/action-result';
import { logger } from '@/lib/logger';
import { requirePermission } from '@/lib/require-permission';
import { createServerClient } from '@/lib/supabase/server';

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
    logger.error({ err: rpcError }, '[upsertHourlyRates] database error');
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
