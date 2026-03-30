'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { logAction } from '@/features/audit/actions/log-action';
import { type ActionResult, err, ok } from '@/lib/action-result';
import { logger } from '@/lib/logger';
import { requirePermission } from '@/lib/require-permission';
import { createServerClient } from '@/lib/supabase/server';
import { type SlaRateFormValues, slaRateFormSchema } from '../types';

export async function upsertSlaRates(
  accountId: string,
  year: number,
  values: SlaRateFormValues,
): Promise<ActionResult<void>> {
  try {
    await requirePermission('contracts.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  const parsed = slaRateFormSchema.safeParse(values);
  if (!parsed.success) {
    return err(z.flattenError(parsed.error).fieldErrors);
  }

  const supabase = await createServerClient();
  const { data: beforeSla } = await supabase
    .from('sla_rates')
    .select('*, sla_tools(*)')
    .eq('account_id', accountId)
    .eq('year', year)
    .single();

  const { data: slaRate, error: upsertError } = await supabase
    .from('sla_rates')
    .upsert(
      {
        account_id: accountId,
        year,
        fixed_monthly_rate: parsed.data.fixed_monthly_rate,
        support_hourly_rate: parsed.data.support_hourly_rate,
      },
      { onConflict: 'account_id,year' },
    )
    .select('id')
    .single();

  if (upsertError) {
    logger.error({ err: upsertError }, '[upsertSlaRates] upsert error');
    return err('Er is een fout opgetreden');
  }

  const { error: deleteToolsError } = await supabase
    .from('sla_tools')
    .delete()
    .eq('sla_rate_id', slaRate.id);

  if (deleteToolsError) {
    logger.error({ err: deleteToolsError }, '[upsertSlaRates] deleteTools error');
    return err('Er is een fout opgetreden');
  }

  if (parsed.data.tools.length > 0) {
    const { error: insertToolsError } = await supabase.from('sla_tools').insert(
      parsed.data.tools.map((t) => ({
        sla_rate_id: slaRate.id,
        tool_name: t.tool_name,
        monthly_price: t.monthly_price,
      })),
    );

    if (insertToolsError) {
      logger.error({ err: insertToolsError }, '[upsertSlaRates] insertTools error');
      return err('Er is een fout opgetreden');
    }
  }

  await logAction({
    action: 'sla_rates.upserted',
    entityType: 'account',
    entityId: accountId,
    metadata: { year, before: beforeSla, after: parsed.data },
  });

  revalidatePath(`/admin/accounts/${accountId}`);
  return ok();
}
