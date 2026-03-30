'use client';

import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { startTransition, useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';

type RealtimeEvent = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Record<string, unknown>;
  old: Record<string, unknown>;
  timestamp: string;
};

type UseRealtimeOptions = {
  /** Row-level filter to scope events, e.g. "user_id=eq.abc-123" */
  filter?: string;
};

export function useRealtime<T extends Record<string, unknown>>(
  table: string,
  initialData: T[],
  options?: UseRealtimeOptions,
) {
  const [data, setData] = useState<T[]>(initialData);
  const [events, setEvents] = useState<RealtimeEvent[]>([]);

  useEffect(() => {
    const supabase = createBrowserClient();

    const channelConfig: {
      event: '*';
      schema: 'public';
      table: string;
      filter?: string;
    } = { event: '*', schema: 'public', table };

    if (options?.filter) {
      channelConfig.filter = options.filter;
    }

    const channel = supabase
      .channel(`${table}-changes${options?.filter ? `-${options.filter}` : ''}`)
      .on('postgres_changes', channelConfig, (payload: RealtimePostgresChangesPayload<T>) => {
        // startTransition marks these updates as non-urgent, keeping UI responsive
        // during rapid Realtime event bursts
        startTransition(() => {
          const event: RealtimeEvent = {
            eventType: payload.eventType,
            new: payload.new as Record<string, unknown>,
            old: payload.old as Record<string, unknown>,
            timestamp: new Date().toISOString(),
          };
          setEvents((prev) => [event, ...prev].slice(0, 50));

          switch (payload.eventType) {
            case 'INSERT':
              setData((prev) => [payload.new as T, ...prev]);
              break;
            case 'UPDATE':
              setData((prev) =>
                prev.map((row) =>
                  (row as Record<string, unknown>).id ===
                  (payload.new as Record<string, unknown>).id
                    ? (payload.new as T)
                    : row,
                ),
              );
              break;
            case 'DELETE':
              setData((prev) =>
                prev.filter(
                  (row) =>
                    (row as Record<string, unknown>).id !==
                    (payload.old as Record<string, unknown>).id,
                ),
              );
              break;
          }
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, options?.filter]);

  return { data, events };
}
