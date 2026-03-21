'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { ok, err, type ActionResult } from '@/lib/action-result';

export async function moveStoppedToBench(
  consultantId: string,
): Promise<ActionResult<{ id: string }>> {
  if (!z.string().min(1).safeParse(consultantId).success) return err('Ongeldig ID');
  await requirePermission('bench.write');

  const supabase = await createServerClient();

  // Fetch consultant with account name for description
  const { data: consultant, error: fetchError } = await supabase
    .from('active_consultants')
    .select('first_name, last_name, city, role, hourly_rate, stop_date, notes, account_id, accounts(name)')
    .eq('id', consultantId)
    .single();

  if (fetchError || !consultant) {
    return err('Consultant niet gevonden');
  }

  const accountName = (consultant.accounts as { name: string } | null)?.name ?? 'onbekend account';
  const description = `Overgeplaatst van ${accountName}. ${consultant.notes || ''}`.trim();

  const { data: bench, error: insertError } = await supabase
    .from('bench_consultants')
    .insert({
      first_name: consultant.first_name,
      last_name: consultant.last_name,
      city: consultant.city,
      priority: 'Medium',
      available_date: consultant.stop_date ?? new Date().toISOString().split('T')[0],
      min_hourly_rate: consultant.hourly_rate,
      max_hourly_rate: consultant.hourly_rate,
      roles: consultant.role ? [consultant.role] : [],
      technologies: [],
      description,
      is_archived: false,
    })
    .select('id')
    .single();

  if (insertError || !bench) {
    return err(insertError?.message ?? 'Kon bench-record niet aanmaken');
  }

  await logAction({
    action: 'bench_consultant.created_from_stop',
    entityType: 'bench_consultant',
    entityId: bench.id,
    metadata: { source_consultant_id: consultantId },
  });

  revalidatePath('/admin/bench');
  revalidatePath('/admin/consultants');
  return ok({ id: bench.id });
}
