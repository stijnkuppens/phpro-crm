'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { type AccountSubTable, ALLOWED_RELATION_COLUMNS } from '@/features/accounts/types';
import { logAction } from '@/features/audit/actions/log-action';
import { type ActionResult, err, ok } from '@/lib/action-result';
import { logger } from '@/lib/logger';
import { requirePermission } from '@/lib/require-permission';
import { createServerClient } from '@/lib/supabase/server';

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
  const insertValues = table === 'account_cc_services' ? safe : { ...safe, account_id: accountId };
  // biome-ignore lint/suspicious/noExplicitAny: dynamic table name returns union type that cannot be narrowed
  const { data, error } = await (supabase.from(table) as any).insert(insertValues).select('id').single();

  if (error) {
    logger.error({ err: error }, '[addAccountRelation] database error');
    return err('Er is een fout opgetreden');
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
  // biome-ignore lint/suspicious/noExplicitAny: dynamic table name returns union type that cannot be narrowed
  const { error } = await (supabase.from(table) as any).update(safe).eq('id', id);

  if (error) {
    logger.error({ err: error }, '[updateAccountRelation] database error');
    return err('Er is een fout opgetreden');
  }

  revalidatePath('/admin/accounts');
  return ok();
}

export async function deleteAccountRelation(table: AccountSubTable, id: string): Promise<ActionResult> {
  try {
    await requirePermission('accounts.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  const parsedId = z.string().min(1).safeParse(id);
  if (!parsedId.success) return err('Ongeldig ID');

  const supabase = await createServerClient();
  // biome-ignore lint/suspicious/noExplicitAny: dynamic table name returns union type that cannot be narrowed
  const { error } = await (supabase.from(table) as any).delete().eq('id', id);

  if (error) {
    logger.error({ err: error }, '[deleteAccountRelation] database error');
    return err('Er is een fout opgetreden');
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
  // biome-ignore lint/suspicious/noExplicitAny: dynamic table name returns union type that cannot be narrowed
  const { data: before } = await (supabase.from(table) as any).select('*').eq('account_id', accountId);
  const rows = values.map((v) => ({ account_id: accountId, [field]: v }));
  const { error } = await supabase.rpc('sync_account_fk_relation', {
    p_account_id: accountId,
    p_table: table,
    p_rows: rows,
  });

  if (error) {
    logger.error({ err: error }, '[syncAccountFKRelation] database error');
    return err('Er is een fout opgetreden');
  }

  await logAction({
    action: `${table}.synced`,
    entityType: table,
    metadata: { account_id: accountId, count: values.length, before, after: rows },
  });

  revalidatePath('/admin/accounts');
  revalidatePath(`/admin/accounts/${accountId}`);
  return ok();
}
