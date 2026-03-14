'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { ok, err, type ActionResult } from '@/lib/action-result';

export async function approveIndexation(
  accountId: string,
  draftId: string,
): Promise<ActionResult<void>> {
  const { userId } = await requirePermission('indexation.approve');

  const supabase = await createServerClient();

  // Fetch full draft with joins
  const { data: draft, error: fetchError } = await supabase
    .from('indexation_drafts')
    .select(`
      *,
      rates:indexation_draft_rates(*),
      sla:indexation_draft_sla(*),
      sla_tools:indexation_draft_sla_tools(*)
    `)
    .eq('id', draftId)
    .eq('account_id', accountId)
    .single();

  if (fetchError) {
    return err(fetchError.message);
  }

  if (draft.status !== 'draft') {
    return err('Draft is not in draft status');
  }

  const { target_year } = draft;
  const rates = draft.rates as { role: string; proposed_rate: number }[];
  const sla = draft.sla as { fixed_monthly_rate: number; support_hourly_rate: number } | null;
  const slaTools = draft.sla_tools as { tool_name: string; proposed_price: number }[];

  // Write new hourly_rates for target_year
  const { error: deleteRatesError } = await supabase
    .from('hourly_rates')
    .delete()
    .eq('account_id', accountId)
    .eq('year', target_year);

  if (deleteRatesError) {
    return err(deleteRatesError.message);
  }

  if (rates.length > 0) {
    const { error: insertRatesError } = await supabase
      .from('hourly_rates')
      .insert(
        rates.map((r) => ({
          account_id: accountId,
          year: target_year,
          role: r.role,
          rate: r.proposed_rate,
        })),
      );

    if (insertRatesError) {
      return err(insertRatesError.message);
    }
  }

  // Write new sla_rates + sync tools
  if (sla) {
    const { data: slaRate, error: slaUpsertError } = await supabase
      .from('sla_rates')
      .upsert(
        {
          account_id: accountId,
          year: target_year,
          fixed_monthly_rate: sla.fixed_monthly_rate,
          support_hourly_rate: sla.support_hourly_rate,
        },
        { onConflict: 'account_id,year' },
      )
      .select('id')
      .single();

    if (slaUpsertError) {
      return err(slaUpsertError.message);
    }

    const { error: deleteToolsError } = await supabase
      .from('sla_tools')
      .delete()
      .eq('sla_rate_id', slaRate.id);

    if (deleteToolsError) {
      return err(deleteToolsError.message);
    }

    if (slaTools.length > 0) {
      const { error: insertToolsError } = await supabase
        .from('sla_tools')
        .insert(
          slaTools.map((t) => ({
            sla_rate_id: slaRate.id,
            tool_name: t.tool_name,
            monthly_price: t.proposed_price,
          })),
        );

      if (insertToolsError) {
        return err(insertToolsError.message);
      }
    }
  }

  // Create indexation_history entry
  const { data: history, error: historyError } = await supabase
    .from('indexation_history')
    .insert({
      account_id: accountId,
      target_year: draft.target_year,
      percentage: draft.percentage,
      info: draft.info,
      adjustment_pct_hourly: draft.adjustment_pct_hourly,
      adjustment_pct_sla: draft.adjustment_pct_sla,
    })
    .select('id')
    .single();

  if (historyError) {
    return err(historyError.message);
  }

  // Insert history rates
  if (rates.length > 0) {
    const { error: histRatesError } = await supabase
      .from('indexation_history_rates')
      .insert(
        rates.map((r) => ({
          history_id: history.id,
          role: r.role,
          rate: r.proposed_rate,
        })),
      );

    if (histRatesError) {
      return err(histRatesError.message);
    }
  }

  // Insert history sla
  if (sla) {
    const { error: histSlaError } = await supabase
      .from('indexation_history_sla')
      .insert({
        history_id: history.id,
        fixed_monthly_rate: sla.fixed_monthly_rate,
        support_hourly_rate: sla.support_hourly_rate,
      });

    if (histSlaError) {
      return err(histSlaError.message);
    }

    if (slaTools.length > 0) {
      const { error: histToolsError } = await supabase
        .from('indexation_history_sla_tools')
        .insert(
          slaTools.map((t) => ({
            history_id: history.id,
            tool_name: t.tool_name,
            price: t.proposed_price,
          })),
        );

      if (histToolsError) {
        return err(histToolsError.message);
      }
    }
  }

  // Delete the draft
  const { error: deleteDraftError } = await supabase
    .from('indexation_drafts')
    .delete()
    .eq('id', draftId);

  if (deleteDraftError) {
    return err(deleteDraftError.message);
  }

  await logAction({
    action: 'indexation.approved',
    entityType: 'account',
    entityId: accountId,
    metadata: { draft_id: draftId, target_year, approved_by: userId },
  });

  revalidatePath(`/admin/accounts/${accountId}`);
  return ok();
}
