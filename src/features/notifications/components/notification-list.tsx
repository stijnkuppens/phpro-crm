'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/use-auth';
import { markAsRead, markAllAsRead } from '../actions/mark-as-read';
import type { Notification } from '../types';
import { Button } from '@/components/ui/button';

export function NotificationList() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const supabase = createBrowserClient();
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (cancelled) return;
        if (data) setNotifications(data as Notification[]);
      });
    return () => { cancelled = true; };
  }, [user]);

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
        <h1 className="text-2xl font-bold">Notifications</h1>
        {hasUnread && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            Mark all as read
          </Button>
        )}
      </div>
      {notifications.length === 0 ? (
        <p className="text-muted-foreground">No notifications yet.</p>
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
                {new Date(n.created_at).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
