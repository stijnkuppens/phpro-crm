'use server';

import { revalidatePath } from 'next/cache';
import { createServiceRoleClient } from '@/lib/supabase/admin';
import { requirePermission } from '@/lib/require-permission';
import { ok, err, type ActionResult } from '@/lib/action-result';
import { createExportJobSchema, type CreateExportJobValues, type AllowedExportEntity } from '../types';
import { ACCOUNT_EXPORT_SELECT } from '@/features/accounts/export-columns';
import { CONTACT_EXPORT_SELECT } from '@/features/contacts/export-columns';
import { DEAL_EXPORT_SELECT } from '@/features/deals/export-columns';
import { CONSULTANT_EXPORT_SELECT } from '@/features/consultants/export-columns';

const ENTITY_SELECT_QUERIES: Record<AllowedExportEntity, string> = {
  accounts: ACCOUNT_EXPORT_SELECT,
  contacts: CONTACT_EXPORT_SELECT,
  deals: DEAL_EXPORT_SELECT,
  consultants: CONSULTANT_EXPORT_SELECT,
  activities: '*',
  communications: '*',
};

export async function createExportJob(
  values: CreateExportJobValues,
): Promise<ActionResult<{ id: string }>> {
  const { userId } = await requirePermission('jobs.read');

  const parsed = createExportJobSchema.safeParse(values);
  if (!parsed.success) {
    return err(parsed.error.flatten().fieldErrors);
  }

  const { entity, format, filters, columns } = parsed.data;
  const selectQuery = ENTITY_SELECT_QUERIES[entity];
  const supabase = createServiceRoleClient();

  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .insert({
      type: 'export',
      entity,
      format,
      filters: { ...filters, columns },
      select_query: selectQuery,
      requested_by: userId,
    })
    .select('id')
    .single();

  if (jobError) {
    console.error('[createExportJob]', jobError);
    return err('Er is een fout opgetreden');
  }

  // The AFTER INSERT trigger on the jobs table automatically calls
  // the Edge Function via pg_net — no manual dispatch needed.

  revalidatePath('/admin/jobs');
  return ok({ id: job.id });
}
