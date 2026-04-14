import { createServerClient as createClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getClientEnv, getServerEnv } from '@/lib/env';
import { COOKIE_NAME } from '@/lib/supabase/cookie-name';
import type { Database } from '@/types/database';

export async function createServerClient() {
  const cookieStore = await cookies();
  const env = getServerEnv();
  const clientEnv = getClientEnv();

  return createClient<Database>(env.SUPABASE_URL, clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookieOptions: { name: COOKIE_NAME },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          // biome-ignore lint/suspicious/useIterableCallbackReturn: forEach callback does not need a return value
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from Server Component — ignore
        }
      },
    },
  });
}
