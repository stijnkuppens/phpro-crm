// Explicit cookie name shared across browser + server Supabase clients.
//
// @supabase/ssr derives cookie names from the Supabase URL:
//   `sb-${hostname.split('.')[0]}-auth-token`
//
// In production the browser uses the public URL (NEXT_PUBLIC_SUPABASE_URL,
// e.g. https://api-crm-dev.phpro.be) while server-side code uses the
// internal Docker URL (SUPABASE_URL, e.g. http://kong:8000). Different
// hostnames → different cookie names → the proxy can't find the session
// cookies and redirects back to /login.
//
// Setting an explicit name forces all clients to agree on the same cookie
// regardless of which URL they connect through.
export const COOKIE_NAME = 'sb-phpro-crm-auth-token';
