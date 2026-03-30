import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Auth callback route handler.
 *
 * Handles two flows:
 * - PKCE flow (OAuth providers): receives `?code=...` query param
 * - Fallback redirect: if no code, redirects to login
 *
 * Note: Implicit grant flow (invite, magic link, recovery) puts tokens
 * in the URL hash fragment which the server cannot see. Those are handled
 * client-side on the login page instead.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const nextParam = searchParams.get('next') ?? '/admin';
  const safeNext = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/admin';

  if (!code) {
    return NextResponse.redirect(new URL('/login', origin));
  }

  const response = NextResponse.redirect(new URL(safeNext, origin));

  const supabase = createServerClient(process.env.SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // biome-ignore lint/suspicious/useIterableCallbackReturn: forEach callback does not need a return value
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  await supabase.auth.exchangeCodeForSession(code);

  return response;
}
