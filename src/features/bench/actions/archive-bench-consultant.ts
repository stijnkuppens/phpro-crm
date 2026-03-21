'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { ok, err, type ActionResult } from '@/lib/action-result';

export async function archiveBenchConsultant(
  id: string,
  archive = true,
): Promise<ActionResult> {
  try {
    await requirePermission('bench.write');
  } catch {
    return err('Onvoldoende rechten');
  }
  if (!z.string().min(1).safeParse(id).success) return err('Ongeldig ID');

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('bench_consultants')
    .update({ is_archived: archive })
    .eq('id', id);

  if (error) {
    return err(error.message);
  }

  await logAction({
    action: archive ? 'bench_consultant.archived' : 'bench_consultant.unarchived',
    entityType: 'bench_consultant',
    entityId: id,
    metadata: { is_archived: archive },
  });

  revalidatePath('/admin/bench');
  return ok();
}
