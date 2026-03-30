import { createBrowserClient as createClient } from '@supabase/ssr';
import { getClientEnv } from '@/lib/env';
import type { Database } from '@/types/database';

// Singleton — one client instance for the entire browser session.
// Prevents multiple WebSocket connections and token refresh intervals.
let client: ReturnType<typeof createClient<Database>> | null = null;

export function createBrowserClient() {
  if (!client) {
    const env = getClientEnv();
    client = createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  }
  return client;
}

/**
 * Append the anon key to a Supabase signed URL so it passes through Kong.
 * Kong requires `apikey` on every request; the Supabase SDK only sends it
 * as a header, which isn't present when the browser fetches the URL directly
 * (e.g. <img src> or window.open).
 */
export function withApiKey(signedUrl: string): string {
  const separator = signedUrl.includes('?') ? '&' : '?';
  return `${signedUrl}${separator}apikey=${getClientEnv().NEXT_PUBLIC_SUPABASE_ANON_KEY}`;
}
