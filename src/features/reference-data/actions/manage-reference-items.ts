'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';
import { ok, err, type ActionResult } from '@/lib/action-result';
import { refItemSchema, REF_TABLES, type RefTableKey, type RefItemFormValues } from '../types';

function isValidTable(table: string): table is RefTableKey {
  return REF_TABLES.some((t) => t.key === table);
}

export async function createReferenceItem(
  table: RefTableKey,
  values: RefItemFormValues,
): Promise<ActionResult<{ id: string }>> {
  if (!isValidTable(table)) return err('Invalid table');

  const parsed = refItemSchema.safeParse(values);
  if (!parsed.success) return err(parsed.error.flatten().fieldErrors);

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from(table) as any)
    .insert(parsed.data)
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
  if (!isValidTable(table)) return err('Invalid table');

  const parsed = refItemSchema.safeParse(values);
  if (!parsed.success) return err(parsed.error.flatten().fieldErrors);

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from(table) as any)
    .update(parsed.data)
    .eq('id', id);

  if (error) return err(error.message);

  revalidatePath('/admin/reference-data');
  return ok();
}

export async function deleteReferenceItem(
  table: RefTableKey,
  id: string,
): Promise<ActionResult> {
  if (!isValidTable(table)) return err('Invalid table');

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from(table) as any)
    .delete()
    .eq('id', id);

  if (error) return err(error.message);

  revalidatePath('/admin/reference-data');
  return ok();
}
