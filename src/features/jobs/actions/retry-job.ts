'use server';

import { createServiceRoleClient } from '@/lib/supabase/admin';
import { requirePermission } from '@/lib/require-permission';
import { ok, err, type ActionResult } from '@/lib/action-result';
import { z } from 'zod';

export async function retryJob(id: string): Promise<ActionResult> {
  const { userId } = await requirePermission('jobs.read');

  if (!z.string().min(1).safeParse(id).success) {
    return err('Ongeldig job ID');
  }

  const supabase = createServiceRoleClient();

  // Verify ownership and that job is actually failed
  const { data: job, error: fetchError } = await supabase
    .from('jobs')
    .select('id, requested_by, status')
    .eq('id', id)
    .single();

  if (fetchError || !job) return err('Job niet gevonden');
  if (job.requested_by !== userId) return err('Geen toegang');
  if (job.status !== 'failed') return err('Alleen mislukte jobs kunnen opnieuw gestart worden');

  // Reset job to pending state
  const { error: updateError } = await supabase
    .from('jobs')
    .update({
      status: 'pending',
      progress: 0,
      error: null,
      started_at: null,
      completed_at: null,
      file_path: null,
      file_size: null,
      row_count: null,
    })
    .eq('id', id);

  if (updateError) {
    console.error('[retryJob] update', updateError);
    return err('Er is een fout opgetreden');
  }

  // Manually trigger the Edge Function (the INSERT trigger only fires on new rows)
  const { error: triggerError } = await supabase.rpc('trigger_job_retry', {
    p_job_id: id,
  });

  if (triggerError) {
    console.error('[retryJob] trigger', triggerError);
    return err('Er is een fout opgetreden');
  }

  return ok();
}
