'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { ok, err, type ActionResult } from '@/lib/action-result';

const schema = z.object({
  consultant_id: z.string().min(1),
  type: z.enum(['rechtstreeks', 'cronos']),
  cc_name: z.string().optional().nullable(),
  cc_contact_person: z.string().optional().nullable(),
  cc_email: z.string().optional().nullable(),
  cc_phone: z.string().optional().nullable(),
  cc_distribution: z.string().optional().nullable(),
});

export type UpsertContractAttributionValues = z.infer<typeof schema>;

export async function upsertContractAttribution(
  values: UpsertContractAttributionValues,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission('consultants.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    return err(parsed.error.flatten().fieldErrors);
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('consultant_contract_attributions')
    .upsert(parsed.data, { onConflict: 'consultant_id' })
    .select('id')
    .single();

  if (error) {
    return err(error.message);
  }

  await logAction({
    action: 'consultant.contract_attribution_upserted',
    entityType: 'consultant',
    entityId: data.id,
    metadata: { consultant_id: parsed.data.consultant_id },
  });

  revalidatePath('/admin/consultants');
  return ok(data);
}
