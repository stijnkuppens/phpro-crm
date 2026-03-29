'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';
import { ok, err, type ActionResult } from '@/lib/action-result';
import { requirePermission } from '@/lib/require-permission';
import { refItemSchema, REF_TABLES, type RefTableKey, type RefItemFormValues } from '../types';

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
  const { data, error } = await (supabase.from(table) as any)
    .insert(toDbRow(parsed.data))
    .select('id')
    .single();

  if (error) return err(error.message);

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
  const { error } = await (supabase.from(table) as any)
    .update(toDbRow(parsed.data))
    .eq('id', id);

  if (error) return err(error.message);

  revalidatePath('/admin/reference-data');
  return ok();
}

export async function deleteReferenceItem(
  table: RefTableKey,
  id: string,
): Promise<ActionResult> {
  try {
    await requirePermission('reference_data.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  if (!isValidTable(table)) return err('Invalid table');

  const supabase = await createServerClient();
  const { error } = await (supabase.from(table) as any)
    .delete()
    .eq('id', id);

  if (error) return err(error.message);

  revalidatePath('/admin/reference-data');
  return ok();
}
