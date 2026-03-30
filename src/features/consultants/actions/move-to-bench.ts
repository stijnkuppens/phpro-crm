'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { logAction } from '@/features/audit/actions/log-action';
import { type ActionResult, err, ok } from '@/lib/action-result';
import { logger } from '@/lib/logger';
import { requirePermission } from '@/lib/require-permission';
import { createServerClient } from '@/lib/supabase/server';

export async function moveToBench(id: string): Promise<ActionResult> {
  try {
    await requirePermission('consultants.write');
  } catch {
    return err('Onvoldoende rechten');
  }
  if (!z.string().min(1).safeParse(id).success) return err('Ongeldig ID');

  const supabase = await createServerClient();

  // Fetch current consultant to check existing bench fields
  const { data: consultant, error: fetchError } = await supabase.from('consultants').select('*').eq('id', id).single();

  if (fetchError || !consultant) {
    return err('Consultant niet gevonden');
  }

  const today = new Date().toISOString().split('T')[0];

  const { error } = await supabase
    .from('consultants')
    .update({
      status: 'bench' as const,
      // Clear active fields
      account_id: null,
      client_name: null,
      client_city: null,
      start_date: null,
      end_date: null,
      is_indefinite: false,
      hourly_rate: null,
      sow_url: null,
      stop_date: null,
      stop_reason: null,
      // Set bench defaults if not already set
      available_date: consultant.available_date ?? today,
      priority: consultant.priority ?? 'Medium',
    })
    .eq('id', id);

  if (error) {
    logger.error({ err: error }, '[moveToBench] database error');
    return err('Er is een fout opgetreden');
  }

  await logAction({
    action: 'consultant.moved_to_bench',
    entityType: 'consultant',
    entityId: id,
    metadata: { before: consultant },
  });

  revalidatePath('/admin/consultants');
  return ok();
}
