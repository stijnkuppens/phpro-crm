'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { markAsRead, markAllAsRead } from '../actions/mark-as-read';
import type { Notification } from '../types';
import { Button } from '@/components/ui/button';

type Props = {
  initialData: Notification[];
};

export function NotificationList({ initialData }: Props) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>(initialData);

  const handleClick = useCallback(
    async (notification: Notification) => {
      if (!notification.read) {
        await markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)),
        );
      }
      const link = (notification.metadata as Record<string, unknown> | null)?.link as string | undefined;
      if (link) {
        router.push(link);
      }
    },
    [router],
  );

  const handleMarkAllRead = useCallback(async () => {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div className="space-y-4">
      {hasUnread && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            Markeer alles als gelezen
          </Button>
        </div>
      )}
      {notifications.length === 0 ? (
        <p className="text-muted-foreground">Nog geen meldingen.</p>
      ) : (
        <ul className="divide-y">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`flex cursor-pointer flex-col gap-1 p-4 hover:bg-muted/50 ${!n.read ? 'bg-muted/30' : ''}`}
              onClick={() => handleClick(n)}
            >
              <span className={n.read ? 'text-muted-foreground' : 'font-medium'}>
                {n.title}
              </span>
              {n.message && (
                <span className="text-sm text-muted-foreground">{n.message}</span>
              )}
              <span className="text-xs text-muted-foreground">
                {n.created_at ? new Date(n.created_at).toLocaleDateString() : '—'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
