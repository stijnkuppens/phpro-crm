'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { ok, err, type ActionResult } from '@/lib/action-result';

type SubTable =
  | 'account_tech_stacks'
  | 'account_hosting'
  | 'account_competence_centers'
  | 'account_samenwerkingsvormen'
  | 'account_manual_services'
  | 'account_services';

export async function addAccountRelation(
  accountId: string,
  table: SubTable,
  values: Record<string, unknown>,
): Promise<ActionResult<{ id: string }>> {
  await requirePermission('accounts.write');

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from(table) as any)
    .insert({ ...values, account_id: accountId })
    .select('id')
    .single();

  if (error) {
    return err(error.message);
  }

  await logAction({
    action: `${table}.created`,
    entityType: table,
    entityId: data.id,
    metadata: { account_id: accountId },
  });

  return ok(data);
}

export async function updateAccountRelation(
  table: SubTable,
  id: string,
  values: Record<string, unknown>,
): Promise<ActionResult> {
  await requirePermission('accounts.write');

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from(table) as any)
    .update(values)
    .eq('id', id);

  if (error) {
    return err(error.message);
  }

  await logAction({
    action: `${table}.updated`,
    entityType: table,
    entityId: id,
  });

  return ok();
}

export async function deleteAccountRelation(
  table: SubTable,
  id: string,
): Promise<ActionResult> {
  await requirePermission('accounts.write');

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from(table) as any)
    .delete()
    .eq('id', id);

  if (error) {
    return err(error.message);
  }

  await logAction({
    action: `${table}.deleted`,
    entityType: table,
    entityId: id,
  });

  return ok();
}

/**
 * Sync a list of simple string values for a sub-table.
 * Used for tech_stacks, samenwerkingsvormen, manual_services, account_services.
 * Deletes all existing rows and inserts new ones.
 */
export async function syncAccountStringRelation(
  accountId: string,
  table: 'account_tech_stacks' | 'account_samenwerkingsvormen' | 'account_manual_services' | 'account_services',
  field: string,
  values: string[],
): Promise<ActionResult> {
  await requirePermission('accounts.write');

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const queryTable = (t: string) => supabase.from(t) as any;

  // Delete existing
  const { error: deleteError } = await queryTable(table)
    .delete()
    .eq('account_id', accountId);

  if (deleteError) {
    return err(deleteError.message);
  }

  // Insert new
  if (values.length > 0) {
    const rows = values.map((v) => ({ account_id: accountId, [field]: v }));
    const { error: insertError } = await queryTable(table)
      .insert(rows);

    if (insertError) {
      return err(insertError.message);
    }
  }

  await logAction({
    action: `${table}.synced`,
    entityType: table,
    metadata: { account_id: accountId, count: values.length },
  });

  return ok();
}
