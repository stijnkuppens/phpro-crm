'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { ok, err, type ActionResult } from '@/lib/action-result';

const linkSchema = z.object({
  consultant_id: z.string().min(1, 'Consultant is verplicht'),
  account_id: z.string().min(1, 'Account is verplicht'),
  role: z.string().optional(),
  start_date: z.string().min(1, 'Startdatum is verplicht'),
  end_date: z.string().optional().nullable(),
  is_indefinite: z.boolean().optional(),
  hourly_rate: z.coerce.number().min(0, 'Uurtarief is verplicht'),
  notice_period_days: z.coerce.number().optional(),
  sow_url: z.string().optional(),
  notes: z.string().optional(),
});

export type LinkConsultantToAccountValues = z.infer<typeof linkSchema>;

export async function linkConsultantToAccount(
  values: LinkConsultantToAccountValues,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission('consultants.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  const parsed = linkSchema.safeParse(values);
  if (!parsed.success) return err(parsed.error.flatten().fieldErrors);

  const supabase = await createServerClient();

  const { data, error } = await supabase.rpc('link_consultant_to_account', {
    p_consultant_id: parsed.data.consultant_id,
    p_account_id: parsed.data.account_id,
    p_role: parsed.data.role ?? undefined,
    p_start_date: parsed.data.start_date,
    p_end_date: parsed.data.is_indefinite ? undefined : (parsed.data.end_date ?? undefined),
    p_is_indefinite: parsed.data.is_indefinite ?? false,
    p_hourly_rate: parsed.data.hourly_rate,
    p_notice_period_days: parsed.data.notice_period_days ?? 30,
    p_sow_url: parsed.data.sow_url ?? undefined,
    p_notes: parsed.data.notes ?? undefined,
  });

  if (error) {
    return err(error.message);
  }

  const consultantId = data as string;

  await logAction({
    action: 'consultant.linked_to_account',
    entityType: 'consultant',
    entityId: consultantId,
    metadata: {
      consultant_id: parsed.data.consultant_id,
      account_id: parsed.data.account_id,
    },
  });

  revalidatePath('/admin/consultants');
  revalidatePath(`/admin/accounts/${parsed.data.account_id}`);

  return ok({ id: consultantId });
}
