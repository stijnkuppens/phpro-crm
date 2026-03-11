'use client';

import { useEffect, useState, startTransition } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type RealtimeEvent = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Record<string, unknown>;
  old: Record<string, unknown>;
  timestamp: string;
};

export function useRealtime<T extends Record<string, unknown>>(
  table: string,
  initialData: T[],
) {
  const [data, setData] = useState<T[]>(initialData);
  const [events, setEvents] = useState<RealtimeEvent[]>([]);

  useEffect(() => {
    const supabase = createBrowserClient();
    const channel = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload: RealtimePostgresChangesPayload<T>) => {
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
                    (row as Record<string, unknown>).id === (payload.new as Record<string, unknown>).id
                      ? (payload.new as T)
                      : row,
                  ),
                );
                break;
              case 'DELETE':
                setData((prev) =>
                  prev.filter(
                    (row) =>
                      (row as Record<string, unknown>).id !== (payload.old as Record<string, unknown>).id,
                  ),
                );
                break;
            }
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  return { data, events };
}
