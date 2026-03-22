'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/require-permission';
import { createServiceRoleClient } from '@/lib/supabase/admin';
import { logAction } from '@/features/audit/actions/log-action';
import { ok, err, type ActionResult } from '@/lib/action-result';
import { roles } from '@/types/acl';
import { sendEmail } from '@/lib/email';

const inviteSchema = z.object({
  email: z.string().email('Ongeldig e-mailadres'),
  fullName: z.string().min(1, 'Naam is verplicht'),
  role: z.enum(roles, { message: 'Ongeldige rol' }),
});

export type InviteUserValues = z.infer<typeof inviteSchema>;

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  sales_manager: 'Sales Manager',
  sales_rep: 'Sales Rep',
  customer_success: 'Customer Success',
  marketing: 'Marketing',
};

export async function inviteUser(
  values: InviteUserValues,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission('users.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  const parsed = inviteSchema.safeParse(values);
  if (!parsed.success) return err(parsed.error.flatten().fieldErrors);

  const { email, fullName, role } = parsed.data;
  const admin = createServiceRoleClient();

  // Create user without sending Supabase's default email
  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
      user_metadata: { full_name: fullName },
      email_confirm: false,
    });

  if (createError) {
    if (createError.message.includes('already been registered')) {
      return err('Dit e-mailadres is al geregistreerd');
    }
    return err(createError.message);
  }

  // handle_new_user() trigger created user_profiles with default role 'viewer'
  // Update to the selected role
  const { error: roleError } = await admin
    .from('user_profiles')
    .update({ role })
    .eq('id', created.user.id);

  if (roleError) {
    return err(`Gebruiker aangemaakt maar rol instellen mislukt: ${roleError.message}`);
  }

  // Generate invite link for the branded email
  const { data: linkData, error: linkError } =
    await admin.auth.admin.generateLink({
      type: 'invite',
      email,
      options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://127.0.0.1:3000'}/auth/callback?next=/reset-password` },
    });

  if (linkError) {
    return err(`Gebruiker aangemaakt maar uitnodigingslink genereren mislukt: ${linkError.message}`);
  }

  // Send branded invite email
  const roleLabel = ROLE_LABELS[role] ?? role;
  await sendEmail({
    to: email,
    subject: 'Je bent uitgenodigd voor het CRM',
    body: [
      `Hallo ${fullName},`,
      `Je bent uitgenodigd om toegang te krijgen tot het CRM als ${roleLabel}.`,
      `Klik op de onderstaande link om je account te activeren en een wachtwoord in te stellen:`,
      `<a href="${linkData.properties.action_link}" style="display:inline-block;padding:12px 24px;background:#bdd431;color:#1a1a1a;border-radius:8px;text-decoration:none;font-weight:600;margin:8px 0">Account activeren</a>`,
      `Als je deze uitnodiging niet verwacht hebt, kun je deze e-mail negeren.`,
    ].join('\n'),
  });

  await logAction({
    action: 'user.invited',
    entityType: 'user',
    entityId: created.user.id,
    metadata: { email, fullName, role },
  });

  revalidatePath('/admin/users');

  return ok({ id: created.user.id });
}
