'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { type ActionResult, err, ok } from '@/lib/action-result';
import { logger } from '@/lib/logger';
import { requirePermission } from '@/lib/require-permission';
import { createServerClient } from '@/lib/supabase/server';
import { REF_TABLES, type RefItemFormValues, type RefTableKey, refItemSchema } from '../types';

function isValidTable(table: string): table is RefTableKey {
  return REF_TABLES.some((t) => t.key === table);
}

/** Map form values (is_active) to DB column (active) */
function toDbRow(values: RefItemFormValues) {
  const { is_active, ...rest } = values;
  return { ...rest, active: is_active };
}

export async function createReferenceItem(
  table: RefTableKey,
  values: RefItemFormValues,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission('reference_data.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  if (!isValidTable(table)) return err('Invalid table');

  const parsed = refItemSchema.safeParse(values);
  if (!parsed.success) return err(z.flattenError(parsed.error).fieldErrors);

  const supabase = await createServerClient();
  // biome-ignore lint/suspicious/noExplicitAny: dynamic table name returns union type that cannot be narrowed
  const { data, error } = await (supabase.from(table) as any).insert(toDbRow(parsed.data)).select('id').single();

  if (error) {
    logger.error({ err: error }, '[createReferenceItem] database error');
    return err('Er is een fout opgetreden');
  }

  revalidatePath('/admin/reference-data');
  return ok(data as { id: string });
}

export async function updateReferenceItem(
  table: RefTableKey,
  id: string,
  values: RefItemFormValues,
): Promise<ActionResult> {
  try {
    await requirePermission('reference_data.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  if (!isValidTable(table)) return err('Invalid table');

  const parsed = refItemSchema.safeParse(values);
  if (!parsed.success) return err(z.flattenError(parsed.error).fieldErrors);

  const supabase = await createServerClient();
  // biome-ignore lint/suspicious/noExplicitAny: dynamic table name returns union type that cannot be narrowed
  const { error } = await (supabase.from(table) as any).update(toDbRow(parsed.data)).eq('id', id);

  if (error) {
    logger.error({ err: error }, '[updateReferenceItem] database error');
    return err('Er is een fout opgetreden');
  }

  revalidatePath('/admin/reference-data');
  return ok();
}

export async function deleteReferenceItem(table: RefTableKey, id: string): Promise<ActionResult> {
  try {
    await requirePermission('reference_data.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  if (!isValidTable(table)) return err('Invalid table');

  const supabase = await createServerClient();
  // biome-ignore lint/suspicious/noExplicitAny: dynamic table name returns union type that cannot be narrowed
  const { error } = await (supabase.from(table) as any).delete().eq('id', id);

  if (error) {
    logger.error({ err: error }, '[deleteReferenceItem] database error');
    return err('Er is een fout opgetreden');
  }

  revalidatePath('/admin/reference-data');
  return ok();
}
