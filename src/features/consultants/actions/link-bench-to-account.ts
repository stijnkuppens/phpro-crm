'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { ok, err, type ActionResult } from '@/lib/action-result';

const linkSchema = z.object({
  bench_consultant_id: z.string().min(1, 'Bench consultant is verplicht'),
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

export type LinkBenchToAccountValues = z.infer<typeof linkSchema>;

export async function linkBenchToAccount(
  values: LinkBenchToAccountValues,
): Promise<ActionResult<{ id: string }>> {
  await requirePermission('consultants.write');

  const parsed = linkSchema.safeParse(values);
  if (!parsed.success) return err(parsed.error.flatten().fieldErrors);

  const supabase = await createServerClient();

  // 1. Fetch bench consultant data
  const { data: bench, error: benchErr } = await supabase
    .from('bench_consultants')
    .select('*')
    .eq('id', parsed.data.bench_consultant_id)
    .single();

  if (benchErr || !bench) return err('Bench consultant niet gevonden');

  // 2. Fetch account for denormalized fields
  const { data: account, error: accErr } = await supabase
    .from('accounts')
    .select('name')
    .eq('id', parsed.data.account_id)
    .single();

  if (accErr || !account) return err('Account niet gevonden');

  // 3. Create active consultant
  const { data: consultant, error: insertErr } = await supabase
    .from('active_consultants')
    .insert({
      account_id: parsed.data.account_id,
      first_name: bench.first_name,
      last_name: bench.last_name,
      role: parsed.data.role ?? bench.roles?.[0] ?? null,
      city: bench.city,
      cv_pdf_url: bench.cv_pdf_url,
      client_name: account.name,
      client_city: null,
      start_date: parsed.data.start_date,
      end_date: parsed.data.is_indefinite ? null : parsed.data.end_date,
      is_indefinite: parsed.data.is_indefinite ?? false,
      hourly_rate: parsed.data.hourly_rate,
      sow_url: parsed.data.sow_url ?? null,
      notice_period_days: parsed.data.notice_period_days ?? 30,
      notes: parsed.data.notes ?? null,
      is_active: true,
      is_stopped: false,
    })
    .select('id')
    .single();

  if (insertErr || !consultant) return err(insertErr?.message ?? 'Fout bij aanmaken');

  // 4. Create initial rate history entry
  const { error: rateErr } = await supabase.from('consultant_rate_history').insert({
    active_consultant_id: consultant.id,
    date: parsed.data.start_date,
    rate: parsed.data.hourly_rate,
    reason: 'Initieel tarief',
  });
  if (rateErr) return err(rateErr.message);

  // 5. Archive the bench consultant
  const { error: archiveErr } = await supabase
    .from('bench_consultants')
    .update({ is_archived: true })
    .eq('id', parsed.data.bench_consultant_id);
  if (archiveErr) return err(archiveErr.message);

  await logAction({
    action: 'active_consultant.linked_from_bench',
    entityType: 'active_consultant',
    entityId: consultant.id,
    metadata: {
      name: `${bench.first_name} ${bench.last_name}`,
      bench_consultant_id: parsed.data.bench_consultant_id,
      account_id: parsed.data.account_id,
    },
  });

  revalidatePath('/admin/consultants');
  revalidatePath(`/admin/accounts/${parsed.data.account_id}`);
  revalidatePath('/admin/bench');

  return ok({ id: consultant.id });
}
