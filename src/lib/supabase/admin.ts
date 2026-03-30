import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getServerEnv } from '@/lib/env';
import type { Database } from '@/types/database';

let cachedClient: SupabaseClient<Database> | null = null;

export function createServiceRoleClient(): SupabaseClient<Database> {
  if (cachedClient) return cachedClient;
  const env = getServerEnv();
  cachedClient = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cachedClient;
}
