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
  | 'account_services'
  | 'account_cc_services';

export async function addAccountRelation(
  accountId: string,
  table: SubTable,
  values: Record<string, unknown>,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission('accounts.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  const supabase = await createServerClient();
  // account_cc_services has no account_id column; other tables do
  const insertValues = table === 'account_cc_services'
    ? values
    : { ...values, account_id: accountId };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from(table) as any)
    .insert(insertValues)
    .select('id')
    .single();

  if (error) {
    return err(error.message);
  }

  return ok(data);
}

export async function updateAccountRelation(
  table: SubTable,
  id: string,
  values: Record<string, unknown>,
): Promise<ActionResult> {
  try {
    await requirePermission('accounts.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from(table) as any)
    .update(values)
    .eq('id', id);

  if (error) {
    return err(error.message);
  }

  return ok();
}

export async function deleteAccountRelation(
  table: SubTable,
  id: string,
): Promise<ActionResult> {
  try {
    await requirePermission('accounts.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from(table) as any)
    .delete()
    .eq('id', id);

  if (error) {
    return err(error.message);
  }

  return ok();
}

/**
 * Sync a list of FK IDs for a sub-table.
 * Used for tech_stacks (technology_id), samenwerkingsvormen (collaboration_type_id),
 * account_services (service_id), manual_services (service_name).
 * Deletes all existing rows and inserts new ones.
 */
export async function syncAccountFKRelation(
  accountId: string,
  table: 'account_tech_stacks' | 'account_samenwerkingsvormen' | 'account_services' | 'account_manual_services',
  field: string,
  values: string[],
): Promise<ActionResult> {
  try {
    await requirePermission('accounts.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  const supabase = await createServerClient();
  const rows = values.map((v) => ({ account_id: accountId, [field]: v }));
  const { error } = await supabase.rpc('sync_account_fk_relation', {
    p_account_id: accountId,
    p_table: table,
    p_rows: rows,
  });

  if (error) {
    return err(error.message);
  }

  await logAction({
    action: `${table}.synced`,
    entityType: table,
    metadata: { account_id: accountId, count: values.length },
  });

  return ok();
}
