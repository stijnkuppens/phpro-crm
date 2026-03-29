'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import {
  benchConsultantFormSchema,
  consultantFormSchema,
  languageFormSchema,
  type BenchConsultantFormValues,
  type ConsultantFormValues,
  type LanguageFormValues,
} from '@/features/consultants/types';
import { ok, err, type ActionResult } from '@/lib/action-result';

export async function updateConsultant(
  id: string,
  values: BenchConsultantFormValues | ConsultantFormValues,
  languages?: LanguageFormValues[],
): Promise<ActionResult> {
  try {
    await requirePermission('consultants.write');
  } catch {
    return err('Onvoldoende rechten');
  }
  if (!z.string().min(1).safeParse(id).success) return err('Ongeldig ID');

  const supabase = await createServerClient();

  // Fetch current status to determine validation schema
  const { data: consultant, error: fetchError } = await supabase
    .from('consultants')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !consultant) {
    return err('Consultant niet gevonden');
  }

  const schema = consultant.status === 'bench' ? benchConsultantFormSchema : consultantFormSchema;
  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    return err(parsed.error.flatten().fieldErrors);
  }

  const { error: updateError } = await supabase
    .from('consultants')
    .update(parsed.data)
    .eq('id', id);

  if (updateError) {
    console.error('[updateConsultant] update', updateError);
    return err('Er is een fout opgetreden');
  }

  // Update languages if provided (validate first)
  if (languages) {
    const langParsed = z.array(languageFormSchema).max(20).safeParse(languages);
    if (!langParsed.success) return err('Ongeldige taalgegevens');
    const validLanguages = langParsed.data;
    const { error: deleteError } = await supabase
      .from('consultant_languages')
      .delete()
      .eq('consultant_id', id);

    if (deleteError) {
      console.error('[updateConsultant] deleteLanguages', deleteError);
      return err('Er is een fout opgetreden');
    }

    if (validLanguages.length > 0) {
      const { error: insertError } = await supabase
        .from('consultant_languages')
        .insert(validLanguages.map((lang) => ({ ...lang, consultant_id: id })));

      if (insertError) {
        console.error('[updateConsultant] insertLanguages', insertError);
        return err('Er is een fout opgetreden');
      }
    }
  }

  await logAction({
    action: 'consultant.updated',
    entityType: 'consultant',
    entityId: id,
    metadata: { name: `${parsed.data.first_name} ${parsed.data.last_name}`, before: consultant, after: parsed.data },
  });

  revalidatePath('/admin/consultants');
  return ok();
}
