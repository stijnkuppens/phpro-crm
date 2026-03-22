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
      if (!notification.is_read) {
        await markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)),
        );
      }
      if (notification.link) {
        router.push(notification.link);
      }
    },
    [router],
  );

  const handleMarkAllRead = useCallback(async () => {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }, []);

  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Meldingen</h1>
        {hasUnread && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            Markeer alles als gelezen
          </Button>
        )}
      </div>
      {notifications.length === 0 ? (
        <p className="text-muted-foreground">Nog geen meldingen.</p>
      ) : (
        <ul className="divide-y">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`flex cursor-pointer flex-col gap-1 p-4 hover:bg-muted/50 ${!n.is_read ? 'bg-muted/30' : ''}`}
              onClick={() => handleClick(n)}
            >
              <span className={n.is_read ? 'text-muted-foreground' : 'font-medium'}>
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
