import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { can } from '@/lib/acl';
import type { Permission, Role } from '@/types/acl';

const routePermissions: [string, Permission][] = [
  ['/admin/notifications', 'notifications.read'],
  ['/admin/settings', 'settings.read'],
  ['/admin/users', 'users.read'],
  ['/admin/audit', 'audit.read'],
  ['/admin/files', 'files.read'],
  ['/admin/accounts', 'accounts.read'],
  ['/admin/contacts', 'contacts.read'],
  ['/admin/deals', 'deals.read'],
  ['/admin/activities', 'activities.read'],
  ['/admin/tasks', 'tasks.read'],
  ['/admin/bench', 'bench.read'],
  ['/admin/consultants', 'consultants.read'],
  ['/admin/people', 'hr.read'],
  ['/admin/materials', 'equipment.read'],
  ['/admin/revenue', 'revenue.read'],
  ['/admin/prognose', 'prognose.read'],
  ['/admin/pipeline', 'pipeline.read'],
];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Set cookies on the request first (for downstream server components)
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          // Create a SINGLE new response with all request cookies forwarded
          response = NextResponse.next({ request });
          // Set all cookies on that single response
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isAuthRoute = ['/login', '/register', '/forgot-password'].includes(
    request.nextUrl.pathname,
  );

  if (isAdminRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check role-based permissions for admin routes
  if (isAdminRoute && user) {
    const { data } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    const role = data?.role as Role | undefined;
    if (!role) {
      return NextResponse.redirect(new URL('/no-access', request.url));
    }

    const match = routePermissions.find(([prefix]) =>
      request.nextUrl.pathname.startsWith(prefix),
    );
    if (match && !can(role, match[1])) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/login', '/register', '/forgot-password', '/reset-password'],
};
