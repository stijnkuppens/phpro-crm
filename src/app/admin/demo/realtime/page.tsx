'use client';

import { useEffect, useRef, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { useRealtime } from '@/lib/hooks/use-realtime';
import { useAuth } from '@/lib/hooks/use-auth';
import { PageHeader } from '@/components/admin/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Trash2, Users, Radio } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import type { Database } from '@/types/database';

type Contact = Database['public']['Tables']['contacts']['Row'];

const randomNames = [
  'Alice Johnson', 'Bob Smith', 'Charlie Brown', 'Diana Prince',
  'Eve Wilson', 'Frank Castle', 'Grace Lee', 'Henry Ford',
];

export default function RealtimeDemoPage() {
  const { user } = useAuth();
  const supabase = createBrowserClient();
  const [initialData, setInitialData] = useState<Contact[] | null>(null);
  const [presenceCount, setPresenceCount] = useState(0);
  const initialized = useRef(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      setInitialData(data ?? []);
    }
    load();
  }, []);

  // Presence tracking
  useEffect(() => {
    if (!user || initialized.current) return;
    initialized.current = true;

    const channel = supabase.channel('demo-presence');
    channel
      .on('presence', { event: 'sync' }, () => {
        setPresenceCount(Object.keys(channel.presenceState()).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: user.id, online_at: new Date().toISOString() });
        }
      });

    return () => {
      initialized.current = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (!initialData) return <Skeleton className="h-96 w-full" />;

  return <RealtimeContent initialData={initialData} presenceCount={presenceCount} />;
}

function RealtimeContent({
  initialData,
  presenceCount,
}: {
  initialData: Contact[];
  presenceCount: number;
}) {
  const supabase = createBrowserClient();
  const { data, events } = useRealtime<Contact>('contacts', initialData);

  const addRandom = async () => {
    const name = randomNames[Math.floor(Math.random() * randomNames.length)];
    const { error } = await supabase.from('contacts').insert({
      name,
      email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
    });
    if (error) toast.error(error.message);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('contacts').delete().eq('id', id);
    if (error) toast.error(error.message);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Realtime Demo"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Demo' },
          { label: 'Realtime' },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1">
              <Users className="h-3 w-3" /> {presenceCount} connected
            </Badge>
            <Button onClick={addRandom}>
              <Plus className="mr-2 h-4 w-4" /> Add Random Contact
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Live Contacts</h2>
          <div className="grid gap-3">
            {data.map((contact) => (
              <Card key={contact.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{contact.name}</p>
                    <p className="text-sm text-muted-foreground">{contact.email ?? '—'}</p>
                  </div>
                  <ConfirmDialog
                    title="Delete contact?"
                    description="This will permanently delete this contact. This action cannot be undone."
                    onConfirm={() => handleDelete(contact.id)}
                    trigger={
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    }
                  />
                </CardContent>
              </Card>
            ))}
            {data.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No contacts. Click &quot;Add Random Contact&quot; to create one.
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Activity Feed</h2>
          <Card>
            <CardContent className="max-h-[600px] overflow-y-auto p-4">
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Waiting for events... Try adding or deleting a contact.
                </p>
              ) : (
                <div className="space-y-2">
                  {events.map((event, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Badge
                        variant={
                          event.eventType === 'INSERT'
                            ? 'default'
                            : event.eventType === 'DELETE'
                              ? 'destructive'
                              : 'secondary'
                        }
                        className="text-xs"
                      >
                        {event.eventType}
                      </Badge>
                      <span className="flex-1 truncate">
                        {(event.new as Record<string, unknown>)?.name as string ??
                          (event.old as Record<string, unknown>)?.name as string ??
                          '—'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardContent className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
          <Radio className="h-4 w-4" />
          Tip: Open this page in two browser tabs to see changes sync live across both.
        </CardContent>
      </Card>
    </div>
  );
}
