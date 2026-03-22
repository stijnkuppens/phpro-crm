import type { Role, Permission } from '@/types/acl';
import { can } from '@/lib/acl';
import { createServerClient } from '@/lib/supabase/server';

/**
 * Server action guard. Call at the top of any "use server" function.
 * Reads the current user session and checks the permission.
 * Throws if denied. Returns user context for use in the action.
 */
export async function requirePermission(
  permission: Permission,
): Promise<{ userId: string; role: Role }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized: not authenticated');
  }

  const role = user.app_metadata?.role as Role | undefined;
  if (!role) {
    throw new Error('Unauthorized: no role assigned');
  }

  if (!can(role, permission)) {
    throw new Error(`Forbidden: missing permission '${permission}'`);
  }

  return { userId: user.id, role };
}
