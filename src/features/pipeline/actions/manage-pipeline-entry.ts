'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { ok, err, type ActionResult } from '@/lib/action-result';
import { pipelineEntryFormSchema, type PipelineEntryFormValues } from '../types';

export async function createPipelineEntry(values: PipelineEntryFormValues): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission('revenue.write');
  } catch {
    return err('Onvoldoende rechten');
  }
  const parsed = pipelineEntryFormSchema.safeParse(values);
  if (!parsed.success) return err(parsed.error.flatten().fieldErrors);
  const supabase = await createServerClient();
  const { data, error } = await supabase.from('pipeline_entries').insert(parsed.data).select('id').single();
  if (error) return err(error.message);
  await logAction({ action: 'pipeline_entry.created', entityType: 'pipeline_entry', entityId: data.id, metadata: { client: parsed.data.client } });
  revalidatePath('/admin/pipeline');
  return ok(data);
}

export async function updatePipelineEntry(id: string, values: PipelineEntryFormValues): Promise<ActionResult> {
  try {
    await requirePermission('revenue.write');
  } catch {
    return err('Onvoldoende rechten');
  }
  const parsed = pipelineEntryFormSchema.safeParse(values);
  if (!parsed.success) return err(parsed.error.flatten().fieldErrors);
  const supabase = await createServerClient();
  const { error } = await supabase.from('pipeline_entries').update(parsed.data).eq('id', id);
  if (error) return err(error.message);
  await logAction({ action: 'pipeline_entry.updated', entityType: 'pipeline_entry', entityId: id });
  revalidatePath('/admin/pipeline');
  return ok();
}

export async function deletePipelineEntry(id: string): Promise<ActionResult> {
  try {
    await requirePermission('revenue.write');
  } catch {
    return err('Onvoldoende rechten');
  }
  const supabase = await createServerClient();
  const { error } = await supabase.from('pipeline_entries').delete().eq('id', id);
  if (error) return err(error.message);
  await logAction({ action: 'pipeline_entry.deleted', entityType: 'pipeline_entry', entityId: id });
  revalidatePath('/admin/pipeline');
  return ok();
}
