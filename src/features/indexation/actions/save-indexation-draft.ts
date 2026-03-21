'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { indexationDraftSchema, type IndexationDraftValues } from '../types';
import { ok, err, type ActionResult } from '@/lib/action-result';

export async function saveIndexationDraft(
  accountId: string,
  values: IndexationDraftValues,
): Promise<ActionResult<{ id: string }>> {
  let userId: string;
  try {
    ({ userId } = await requirePermission('indexation.write'));
  } catch {
    return err('Onvoldoende rechten');
  }

  const parsed = indexationDraftSchema.safeParse(values);
  if (!parsed.success) {
    return err(parsed.error.flatten().fieldErrors);
  }

  const supabase = await createServerClient();

  // Delete existing draft for this account
  const { error: deleteError } = await supabase
    .from('indexation_drafts')
    .delete()
    .eq('account_id', accountId)
    .eq('status', 'draft');

  if (deleteError) {
    return err(deleteError.message);
  }

  // Create new draft
  const { data: draft, error: draftError } = await supabase
    .from('indexation_drafts')
    .insert({
      account_id: accountId,
      target_year: parsed.data.target_year,
      base_year: parsed.data.base_year,
      percentage: parsed.data.percentage,
      status: 'draft',
      info: parsed.data.info ?? null,
      adjustment_pct_hourly: parsed.data.adjustment_pct_hourly ?? null,
      adjustment_pct_sla: parsed.data.adjustment_pct_sla ?? null,
      created_by: userId,
    })
    .select('id')
    .single();

  if (draftError) {
    return err(draftError.message);
  }

  // Insert rates
  if (parsed.data.rates.length > 0) {
    const { error: ratesError } = await supabase
      .from('indexation_draft_rates')
      .insert(
        parsed.data.rates.map((r) => ({
          draft_id: draft.id,
          role: r.role,
          current_rate: r.current_rate,
          proposed_rate: r.proposed_rate,
        })),
      );

    if (ratesError) {
      return err(ratesError.message);
    }
  }

  // Insert SLA
  if (parsed.data.sla) {
    const { error: slaError } = await supabase
      .from('indexation_draft_sla')
      .insert({
        draft_id: draft.id,
        fixed_monthly_rate: parsed.data.sla.fixed_monthly_rate,
        support_hourly_rate: parsed.data.sla.support_hourly_rate,
      });

    if (slaError) {
      return err(slaError.message);
    }
  }

  // Insert SLA tools
  if (parsed.data.sla_tools && parsed.data.sla_tools.length > 0) {
    const { error: toolsError } = await supabase
      .from('indexation_draft_sla_tools')
      .insert(
        parsed.data.sla_tools.map((t) => ({
          draft_id: draft.id,
          tool_name: t.tool_name,
          proposed_price: t.proposed_price,
        })),
      );

    if (toolsError) {
      return err(toolsError.message);
    }
  }

  await logAction({
    action: 'indexation_draft.saved',
    entityType: 'account',
    entityId: accountId,
    metadata: { draft_id: draft.id, target_year: parsed.data.target_year },
  });

  revalidatePath(`/admin/accounts/${accountId}`);
  return ok({ id: draft.id });
}
