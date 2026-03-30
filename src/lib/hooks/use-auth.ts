'use client';

import type { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Role } from '@/types/acl';

type AuthState = {
  user: User | null;
  role: Role | null;
  loading: boolean;
};

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    role: null,
    loading: true,
  });

  useEffect(() => {
    const supabase = createBrowserClient();

    // Use onAuthStateChange exclusively (handles INITIAL_SESSION + subsequent changes).
    // IMPORTANT: Do NOT call supabase.from() inside this callback — it triggers
    // getSession() which awaits initializePromise, causing a deadlock since
    // _notifyAllSubscribers awaits all listener callbacks during initialization.
    // Instead, fetch the role in a separate, non-blocking step.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setState((prev) => ({ ...prev, user: session.user, loading: false }));
        // Fetch role outside the callback's synchronous flow to avoid deadlock
        supabase
          .from('user_profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
          .then(({ data, error }) => {
            if (error) {
              logger.error({ err: error, entity: 'user_profiles' }, 'Failed to fetch user role');
            }
            setState((prev) => ({ ...prev, role: (data?.role as Role) ?? null }));
          });
      } else {
        setState({ user: null, role: null, loading: false });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return state;
}
