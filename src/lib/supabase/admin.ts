import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { getServerEnv } from '@/lib/env';

export function createServiceRoleClient() {
  const env = getServerEnv();
  return createClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
