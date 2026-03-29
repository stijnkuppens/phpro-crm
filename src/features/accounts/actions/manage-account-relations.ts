'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { ok, err, type ActionResult } from '@/lib/action-result';
import { type AccountSubTable, ALLOWED_RELATION_COLUMNS } from '@/features/accounts/types';

function sanitizeValues(table: AccountSubTable, values: Record<string, unknown>): Record<string, unknown> {
  const allowed = ALLOWED_RELATION_COLUMNS[table];
  const sanitized: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in values) sanitized[key] = values[key];
  }
  return sanitized;
}

export async function addAccountRelation(
  accountId: string,
  table: AccountSubTable,
  values: Record<string, unknown>,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission('accounts.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  const parsed = z.string().min(1).safeParse(accountId);
  if (!parsed.success) return err('Ongeldig account ID');

  const safe = sanitizeValues(table, values);
  const supabase = await createServerClient();
  // account_cc_services has no account_id column; other tables do
  const insertValues = table === 'account_cc_services'
    ? safe
    : { ...safe, account_id: accountId };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from(table) as any)
    .insert(insertValues)
    .select('id')
    .single();

  if (error) {
    return err(error.message);
  }

  revalidatePath('/admin/accounts');
  revalidatePath(`/admin/accounts/${accountId}`);
  return ok(data);
}

export async function updateAccountRelation(
  table: AccountSubTable,
  id: string,
  values: Record<string, unknown>,
): Promise<ActionResult> {
  try {
    await requirePermission('accounts.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  const parsedId = z.string().min(1).safeParse(id);
  if (!parsedId.success) return err('Ongeldig ID');

  const safe = sanitizeValues(table, values);
  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from(table) as any)
    .update(safe)
    .eq('id', id);

  if (error) {
    return err(error.message);
  }

  revalidatePath('/admin/accounts');
  return ok();
}

export async function deleteAccountRelation(
  table: AccountSubTable,
  id: string,
): Promise<ActionResult> {
  try {
    await requirePermission('accounts.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  const parsedId = z.string().min(1).safeParse(id);
  if (!parsedId.success) return err('Ongeldig ID');

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from(table) as any)
    .delete()
    .eq('id', id);

  if (error) {
    return err(error.message);
  }

  revalidatePath('/admin/accounts');
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

  revalidatePath('/admin/accounts');
  revalidatePath(`/admin/accounts/${accountId}`);
  return ok();
}
