import { NextResponse } from 'next/server';
import { logAction } from '@/features/audit/actions/log-action';
import { createServiceRoleClient } from '@/lib/supabase/admin';
import { createServerClient } from '@/lib/supabase/server';

/**
 * POST /api/admin/invite
 *
 * Invites a new user to the CRM by email.
 * Requires admin authentication via session cookie.
 *
 * @body {{ email: string }} - Email address to invite
 * @returns {{ success: true }} on success
 * @returns {{ error: string }} with 400/401/500 status on failure
 */
export async function POST(request: Request) {
  const supabase = await createServerClient();

  // Verify the caller is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  // Verify the caller is an admin
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden — admin only' },
      { status: 403, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const { email } = await request.json();
  if (!email || typeof email !== 'string') {
    return NextResponse.json(
      { error: 'Email is required' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  // Use the service role client to invite
  const admin = createServiceRoleClient();
  const { error } = await admin.auth.admin.inviteUserByEmail(email);

  if (error) {
    console.error('[POST /api/admin/invite]', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  await logAction({
    action: 'user.invited',
    entityType: 'user',
    metadata: { email },
  });

  return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
}
