---
name: add-realtime-feature
description: Add realtime subscriptions to pages using Supabase Realtime (postgres_changes, presence, or broadcast). Use this skill whenever the user wants live updates, real-time data sync, online presence indicators, or any form of push-based UI updates — even if they just say "make this page update automatically".
type: skill
---

# Add Realtime Feature

Wire up Supabase Realtime subscriptions following the project's established patterns. Three variants are supported: table sync, filtered subscriptions, and presence.

## Prerequisites

The table must have Realtime enabled in its migration:

```sql
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.{{table}};
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
```

## Variant 1: Full Table Sync (useRealtime hook)

The project has a generic hook at `src/lib/hooks/use-realtime.ts`. Use it for basic cases where you want all INSERT/UPDATE/DELETE events for a table:

```tsx
'use client';

import { useRealtime } from '@/lib/hooks/use-realtime';
import type { Entity } from '@/features/entities/types';

export default function EntitiesPage({ initialData }: { initialData: Entity[] }) {
  const { data, events } = useRealtime<Entity>('entities', initialData);

  return (
    <div>
      {data.map((item) => <div key={item.id}>{item.name}</div>)}

      {/* Optional: show activity feed from events */}
      {events.map((event, i) => (
        <div key={i}>{event.eventType} at {event.timestamp}</div>
      ))}
    </div>
  );
}
```

### How useRealtime works:
- Subscribes to `postgres_changes` with `event: '*'` on the specified table
- Uses `startTransition` for all state updates — keeps UI responsive during rapid event bursts
- INSERT: prepends new record to data array
- UPDATE: maps over data, replaces matching record by `id`
- DELETE: filters out record by `id` from old payload
- Maintains an `events` array (capped at 50) for activity feeds
- Cleanup: `supabase.removeChannel(channel)` on unmount
- Channel name: `${table}-changes`

## Variant 2: Filtered Subscription (custom hook)

For user-specific or filtered data, create a custom subscription:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/use-auth';

export function useMyNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const supabase = createBrowserClient();
    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
          setUnreadCount((prev) => prev + 1);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { notifications, unreadCount };
}
```

### Filter syntax:
- `filter: 'column=eq.value'` — equals
- `filter: 'column=in.(val1,val2)'` — in list
- `filter: 'column=gt.10'` — greater than
- Only one filter per subscription; for complex filters, use multiple channels

## Variant 3: Presence (who's online)

Track which users are currently viewing a page:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/use-auth';

export function usePresence(channelName: string) {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;

    const supabase = createBrowserClient();
    const channel = supabase.channel(channelName);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setOnlineUsers(Object.keys(state));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, channelName]);

  return { onlineUsers };
}
```

## Critical Warning: Supabase Deadlock

**NEVER `await` Supabase queries inside `onAuthStateChange` callbacks.** This creates a deadlock:

```ts
// BAD — deadlocks
supabase.auth.onAuthStateChange(async (_event, session) => {
  const { data } = await supabase.from('profiles').select('role')...
});

// GOOD — non-blocking
supabase.auth.onAuthStateChange((_event, session) => {
  supabase.from('profiles').select('role')...
    .then(({ data }) => setState(prev => ({ ...prev, role: data?.role })));
});
```

## Key Details

- `createBrowserClient()` from `@/lib/supabase/client` is a singleton — safe to call in effects
- Always clean up: `supabase.removeChannel(channel)` in the effect cleanup
- Use `startTransition` when updating state from rapid events to avoid UI jank
- Place custom hooks in `src/features/<feature>/hooks/` or `src/lib/hooks/` if shared
