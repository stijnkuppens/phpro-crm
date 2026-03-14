import { cache } from 'react';
import { createServiceRoleClient } from '@/lib/supabase/admin';

export type UserWithEmail = {
  id: string;
  full_name: string;
  avatar_url: string;
  role: string;
  email: string;
  created_at: string;
};

export const getUsers = cache(async (): Promise<UserWithEmail[]> => {
  const supabase = createServiceRoleClient();

  const [{ data: profiles }, { data: authData }] = await Promise.all([
    supabase.from('user_profiles').select('*').order('created_at', { ascending: false }),
    supabase.auth.admin.listUsers(),
  ]);

  if (!profiles) return [];

  const emailMap = new Map(
    (authData?.users ?? []).map((u) => [u.id, u.email ?? '']),
  );

  return profiles.map((p) => ({
    id: p.id,
    full_name: p.full_name ?? '',
    avatar_url: p.avatar_url ?? '',
    role: p.role,
    email: emailMap.get(p.id) ?? '',
    created_at: p.created_at,
  }));
});
