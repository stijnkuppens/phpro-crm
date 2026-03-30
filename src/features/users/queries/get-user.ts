import { cache } from 'react';
import { logger } from '@/lib/logger';
import { createServiceRoleClient } from '@/lib/supabase/admin';

export type UserDetail = {
  id: string;
  full_name: string;
  avatar_url: string;
  role: string;
  email: string;
  last_sign_in_at: string | null;
  invited_at: string | null;
  email_confirmed_at: string | null;
  created_at: string;
  updated_at: string;
};

export const getUser = cache(async (id: string): Promise<UserDetail | null> => {
  const supabase = createServiceRoleClient();

  const [{ data: profile, error }, { data: authData }] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('id', id).single(),
    supabase.auth.admin.getUserById(id),
  ]);

  if (error || !profile) {
    if (error) logger.error({ err: error, entity: 'users' }, 'Failed to fetch user');
    return null;
  }

  const authUser = authData?.user;

  return {
    id: profile.id,
    full_name: profile.full_name ?? '',
    avatar_url: profile.avatar_url ?? '',
    role: profile.role,
    email: authUser?.email ?? '',
    last_sign_in_at: authUser?.last_sign_in_at ?? null,
    invited_at: authUser?.invited_at ?? null,
    email_confirmed_at: authUser?.email_confirmed_at ?? null,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  };
});
