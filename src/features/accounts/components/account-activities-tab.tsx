'use client';

import { Plus, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/admin/modal';
import { Button } from '@/components/ui/button';
import { deleteActivity } from '@/features/activities/actions/delete-activity';
import { updateActivity } from '@/features/activities/actions/update-activity';
import { ActivityCardList } from '@/features/activities/components/activity-card-list';
import { ActivityForm } from '@/features/activities/components/activity-form';
import type { ActivityFormValues, ActivityWithRelations } from '@/features/activities/types';

type Props = {
  accountId: string;
  accountName?: string;
  initialData: ActivityWithRelations[];
  initialCount: number;
  deals?: { id: string; title: string }[];
};

export function AccountActivitiesTab({
  accountId,
  accountName,
  initialData,
  initialCount: _initialCount,
  deals = [],
}: Props) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ActivityWithRelations | null>(null);

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
    setData((prev) => prev.map((a) => (a.id === activity.id ? { ...a, is_done: !a.is_done } : a)));

    const result = await updateActivity(activity.id, values);
    if ('error' in result && result.error) {
      setData((prev) => prev.map((a) => (a.id === activity.id ? { ...a, is_done: activity.is_done } : a)));
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
    setModalOpen(false);
    router.refresh();
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{data.length} activiteiten</span>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus /> Nieuwe activiteit
        </Button>
      </div>

      <ActivityCardList
        activities={data}
        onToggleDone={handleToggleDone}
        onEdit={setEditTarget}
        onDelete={handleDelete}
        emptyIcon={Sparkles}
        emptyAction={{ label: 'Nieuwe activiteit', onClick: () => setModalOpen(true) }}
      />

      {modalOpen && (
        <Modal open onClose={() => setModalOpen(false)} title="Nieuwe activiteit" size="wide">
          <ActivityForm
            defaultValues={{ account_id: accountId }}
            accounts={accountName ? [{ id: accountId, name: accountName }] : []}
            deals={deals}
            onSuccess={handleCreateSuccess}
            onCancel={() => setModalOpen(false)}
          />
        </Modal>
      )}

      {editTarget && (
        <Modal key={editTarget.id} open onClose={() => setEditTarget(null)} title="Activiteit bewerken" size="wide">
          <ActivityForm
            defaultValues={{
              id: editTarget.id,
              type: editTarget.type as ActivityFormValues['type'],
              subject: editTarget.subject,
              date: editTarget.date,
              duration_minutes: editTarget.duration_minutes,
              account_id: editTarget.account_id,
              deal_id: editTarget.deal_id,
              notes: editTarget.notes,
              is_done: editTarget.is_done ?? false,
              priority: editTarget.priority as ActivityFormValues['priority'],
              assigned_to: editTarget.assigned_to,
            }}
            accounts={accountName ? [{ id: accountId, name: accountName }] : []}
            deals={deals}
            onSuccess={() => {
              setEditTarget(null);
              router.refresh();
            }}
            onCancel={() => setEditTarget(null)}
          />
        </Modal>
      )}
    </div>
  );
}
