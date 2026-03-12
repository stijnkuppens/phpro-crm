import { createBrowserClient as createClient } from '@supabase/ssr';
import type { Database } from '@/types/database';
import { getClientEnv } from '@/lib/env';

// Singleton — one client instance for the entire browser session.
// Prevents multiple WebSocket connections and token refresh intervals.
let client: ReturnType<typeof createClient<Database>> | null = null;

export function createBrowserClient() {
  if (!client) {
    const env = getClientEnv();
    client = createClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  }
  return client;
}
