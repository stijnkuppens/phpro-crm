'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import {
  benchConsultantFormSchema,
  languageFormSchema,
  type BenchConsultantFormValues,
  type LanguageFormValues,
} from '../types';
import { ok, err, type ActionResult } from '@/lib/action-result';

export async function updateBenchConsultant(
  id: string,
  values: BenchConsultantFormValues,
  languages?: LanguageFormValues[],
): Promise<ActionResult> {
  if (!z.string().min(1).safeParse(id).success) return err('Ongeldig ID');
  await requirePermission('bench.write');

  const parsed = benchConsultantFormSchema.safeParse(values);
  if (!parsed.success) {
    return err(parsed.error.flatten().fieldErrors);
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('bench_consultants')
    .update(parsed.data)
    .eq('id', id);

  if (error) {
    return err(error.message);
  }

  if (languages !== undefined) {
    const parsedLanguages = languages.map((l) => languageFormSchema.safeParse(l));
    const invalid = parsedLanguages.find((r) => !r.success);
    if (invalid && !invalid.success) {
      return err(invalid.error.flatten().fieldErrors);
    }

    const { error: deleteError } = await supabase
      .from('bench_consultant_languages')
      .delete()
      .eq('bench_consultant_id', id);

    if (deleteError) {
      return err(deleteError.message);
    }

    if (languages.length > 0) {
      const rows = languages.map((l) => ({ ...l, bench_consultant_id: id }));
      const { error: insertError } = await supabase
        .from('bench_consultant_languages')
        .insert(rows);

      if (insertError) {
        return err(insertError.message);
      }
    }
  }

  await logAction({
    action: 'bench_consultant.updated',
    entityType: 'bench_consultant',
    entityId: id,
    metadata: { name: `${parsed.data.first_name} ${parsed.data.last_name}` },
  });

  revalidatePath('/admin/bench');
  return ok();
}
