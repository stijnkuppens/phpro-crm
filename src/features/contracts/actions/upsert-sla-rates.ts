'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { slaRateFormSchema, type SlaRateFormValues } from '../types';
import { ok, err, type ActionResult } from '@/lib/action-result';

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
    return err(upsertError.message);
  }

  const { error: deleteToolsError } = await supabase
    .from('sla_tools')
    .delete()
    .eq('sla_rate_id', slaRate.id);

  if (deleteToolsError) {
    return err(deleteToolsError.message);
  }

  if (parsed.data.tools.length > 0) {
    const { error: insertToolsError } = await supabase
      .from('sla_tools')
      .insert(
        parsed.data.tools.map((t) => ({
          sla_rate_id: slaRate.id,
          tool_name: t.tool_name,
          monthly_price: t.monthly_price,
        })),
      );

    if (insertToolsError) {
      return err(insertToolsError.message);
    }
  }

  await logAction({
    action: 'sla_rates.upserted',
    entityType: 'account',
    entityId: accountId,
    metadata: { year },
  });

  revalidatePath(`/admin/accounts/${accountId}`);
  return ok();
}
