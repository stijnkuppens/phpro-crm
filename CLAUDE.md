# CLAUDE.md

## Stack

- Next.js 16 (App Router, Turbopack)
- React 19
- Supabase (self-hosted via Docker Compose, Kong gateway on port 8000)
- `@supabase/ssr` for cookie-based auth
- Tailwind CSS v4, shadcn/ui components
- TypeScript strict mode

## Gotchas

### Supabase: Never `await` Supabase queries inside `onAuthStateChange` callbacks

`supabase.auth.onAuthStateChange()` callbacks are invoked by `_notifyAllSubscribers`, which **awaits all listener callbacks** via `Promise.all`. Meanwhile, every `supabase.from().select()` call internally calls `auth.getSession()`, which **awaits `initializePromise`**. Since `_notifyAllSubscribers` runs during initialization, this creates a **deadlock**: initialization waits for the listener, the listener waits for initialization.

**Bad** (deadlocks):
```ts
supabase.auth.onAuthStateChange(async (_event, session) => {
  const { data } = await supabase.from('user_profiles').select('role')...
  setState({ user: session.user, role: data?.role });
});
```

**Good** (non-blocking):
```ts
supabase.auth.onAuthStateChange((_event, session) => {
  setState(prev => ({ ...prev, user: session.user }));
  supabase.from('user_profiles').select('role')...
    .then(({ data }) => setState(prev => ({ ...prev, role: data?.role })));
});
```

This is safe because server-side middleware enforces auth/role checks. The client-side role is for UI only, and `null` role during the brief fetch window is more restrictive, not less.
