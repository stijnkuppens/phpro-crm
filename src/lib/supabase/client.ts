import { createBrowserClient as createClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

// Singleton — one client instance for the entire browser session.
// Prevents multiple WebSocket connections and token refresh intervals.
let client: ReturnType<typeof createClient<Database>> | null = null;

export function createBrowserClient() {
  if (!client) {
    // Fallbacks allow SSR prerendering during `next build` when env vars are absent.
    client = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
    );
  }
  return client;
}
