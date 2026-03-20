'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ActivityWithRelations } from '@/features/activities/types';
import type { TaskWithRelations } from '@/features/tasks/types';
import type { CommunicationWithDetails } from '@/features/communications/types';

type Props = {
  activities: ActivityWithRelations[];
  tasks: TaskWithRelations[];
  communications: CommunicationWithDetails[];
};

const fmtDate = (d: string) => new Date(d).toLocaleDateString('nl-BE');

export function DealLinkedTabs({ activities, tasks, communications }: Props) {
  return (
    <Tabs defaultValue="activities">
      <TabsList>
        <TabsTrigger value="activities">Activiteiten ({activities.length})</TabsTrigger>
        <TabsTrigger value="tasks">Taken ({tasks.length})</TabsTrigger>
        <TabsTrigger value="communications">Communicatie ({communications.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="activities">
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">Geen activiteiten gekoppeld aan deze deal.</p>
        ) : (
          <div className="space-y-2 mt-2">
            {activities.map((a) => (
              <Card key={a.id}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-sm">{a.subject}</span>
                      <Badge variant="outline" className="ml-2 text-[10px]">{a.type}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{fmtDate(a.date)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="tasks">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">Geen taken gekoppeld aan deze deal.</p>
        ) : (
          <div className="space-y-2 mt-2">
            {tasks.map((t) => (
              <Card key={t.id}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-sm">{t.title}</span>
                      <Badge variant="outline" className="ml-2 text-[10px]">{t.status}</Badge>
                      <Badge variant="secondary" className="ml-1 text-[10px]">{t.priority}</Badge>
                    </div>
                    {t.due_date && (
                      <span className="text-xs text-muted-foreground">{fmtDate(t.due_date)}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="communications">
        {communications.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">Geen communicatie gekoppeld aan deze deal.</p>
        ) : (
          <div className="space-y-2 mt-2">
            {communications.map((c) => (
              <Card key={c.id}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-sm">{c.subject}</span>
                      <Badge variant="outline" className="ml-2 text-[10px]">{c.type}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{fmtDate(c.date)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
