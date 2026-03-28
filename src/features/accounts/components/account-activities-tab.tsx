'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/admin/modal';
import { ActivityForm } from '@/features/activities/components/activity-form';
import { updateActivity } from '@/features/activities/actions/update-activity';
import { deleteActivity } from '@/features/activities/actions/delete-activity';
import type { ActivityWithRelations, ActivityFormValues } from '@/features/activities/types';
import { Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';

type Props = {
  accountId: string;
  accountName?: string;
  initialData: ActivityWithRelations[];
  initialCount: number;
  deals?: { id: string; title: string }[];
};

const TYPE_CONFIG: Record<string, { label: string; className: string }> = {
  Meeting: { label: 'Meeting', className: 'bg-green-50 text-green-700 border-green-200' },
  Call: { label: 'Call', className: 'bg-purple-50 text-purple-700 border-purple-200' },
  'E-mail': { label: 'E-mail', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  Demo: { label: 'Demo', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  Lunch: { label: 'Lunch', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  Event: { label: 'Event', className: 'bg-pink-50 text-pink-700 border-pink-200' },
};

export function AccountActivitiesTab({ accountId, accountName, initialData, initialCount, deals = [] }: Props) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [modalOpen, setModalOpen] = useState(false);

  async function handleToggleDone(activity: ActivityWithRelations) {
    const values: ActivityFormValues = {
      type: activity.type as ActivityFormValues['type'],
      subject: activity.subject,
      date: activity.date,
      duration_minutes: activity.duration_minutes,
      account_id: activity.account_id,
      deal_id: activity.deal_id,
      notes: activity.notes,
      is_done: !activity.is_done,
    };

    // Optimistic update
    setData((prev) =>
      prev.map((a) => (a.id === activity.id ? { ...a, is_done: !a.is_done } : a)),
    );

    const result = await updateActivity(activity.id, values);
    if ('error' in result && result.error) {
      // Revert on failure
      setData((prev) =>
        prev.map((a) => (a.id === activity.id ? { ...a, is_done: activity.is_done } : a)),
      );
      toast.error('Kon status niet bijwerken');
    }
  }

  async function handleDelete(id: string) {
    const result = await deleteActivity(id);
    if (result.success) {
      setData((prev) => prev.filter((a) => a.id !== id));
      toast.success('Activiteit verwijderd');
    } else {
      toast.error('Kon activiteit niet verwijderen');
    }
  }

  function handleCreateSuccess() {
    // Re-mount by closing modal; the page will revalidate via server action's revalidatePath
    // For now, we close the modal and let the user see the update on next navigation
    // A simpler approach: just close and rely on revalidation
    setModalOpen(false);
    // Trigger a soft refresh to pick up the new activity from the server
    router.refresh();
  }

  if (data.length === 0 && !modalOpen) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground mb-4">Geen activiteiten gevonden.</p>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Nieuwe activiteit
        </Button>
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nieuwe activiteit" size="wide">
          <ActivityForm
            defaultValues={{ account_id: accountId }}
            accounts={accountName ? [{ id: accountId, name: accountName }] : []}
            deals={deals}
            onSuccess={handleCreateSuccess}
            onCancel={() => setModalOpen(false)}
          />
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{data.length} activiteiten</span>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Nieuwe activiteit
        </Button>
      </div>

      <div className="space-y-2">
        {data.map((activity) => {
          const config = TYPE_CONFIG[activity.type] ?? { label: activity.type, className: 'bg-gray-50 text-gray-700 border-gray-200' };
          return (
            <div
              key={activity.id}
              className={`flex items-center gap-3 p-3 border rounded-lg ${activity.is_done ? 'opacity-60' : ''}`}
            >
              <button
                type="button"
                onClick={() => handleToggleDone(activity)}
                className="shrink-0 text-muted-foreground hover:text-green-600 transition-colors"
                title={activity.is_done ? 'Markeer als niet afgerond' : 'Markeer als afgerond'}
              >
                {activity.is_done ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5" />
                )}
              </button>

              <Badge variant="outline" className={config.className}>
                {config.label}
              </Badge>

              <div className="flex-1 min-w-0">
                <span className={`text-sm font-medium ${activity.is_done ? 'line-through' : ''}`}>
                  {activity.subject}
                </span>
                {activity.deal && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {activity.deal.title}
                  </Badge>
                )}
              </div>

              <span className="text-xs text-muted-foreground shrink-0">
                {new Date(activity.date).toLocaleDateString('nl-BE')}
              </span>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(activity.id)}
                className="shrink-0 h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="Verwijderen"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nieuwe activiteit" size="wide">
        <ActivityForm
          defaultValues={{ account_id: accountId }}
          onSuccess={handleCreateSuccess}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
