import { cache } from 'react';
import { createServiceRoleClient } from '@/lib/supabase/admin';

export type UserWithEmail = {
  id: string;
  full_name: string;
  avatar_url: string;
  role: string;
  email: string;
  last_sign_in_at: string | null;
  created_at: string;
};

export const getUsers = cache(async (): Promise<UserWithEmail[]> => {
  const supabase = createServiceRoleClient();

  const [{ data: profiles }, { data: authData }] = await Promise.all([
    supabase.from('user_profiles').select('*').order('created_at', { ascending: false }),
    supabase.auth.admin.listUsers(),
  ]);

  if (!profiles) return [];

  const authMap = new Map(
    (authData?.users ?? []).map((u) => [
      u.id,
      { email: u.email ?? '', last_sign_in_at: u.last_sign_in_at ?? null },
    ]),
  );

  return profiles.map((p) => {
    const auth = authMap.get(p.id);
    return {
      id: p.id,
      full_name: p.full_name ?? '',
      avatar_url: p.avatar_url ?? '',
      role: p.role,
      email: auth?.email ?? '',
      last_sign_in_at: auth?.last_sign_in_at ?? null,
      created_at: p.created_at,
    };
  });
});
