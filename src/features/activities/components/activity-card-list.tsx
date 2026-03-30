'use client';

import type { LucideIcon } from 'lucide-react';
import { CheckCircle2, Clock } from 'lucide-react';
import { useMemo } from 'react';
import { EmptyState } from '@/components/admin/empty-state';
import type { ActivityWithRelations } from '../types';
import { ActivityRow } from './activity-row';

type ActivityCardListProps = {
  activities: ActivityWithRelations[];
  showAccount?: boolean;
  onToggleDone: (activity: ActivityWithRelations) => void;
  onEdit?: (activity: ActivityWithRelations) => void;
  onDelete: (id: string) => void;
  emptyAction?: { label: string; onClick: () => void };
  emptyIcon?: LucideIcon;
};

function ActivityTable({
  title,
  icon: Icon,
  titleColor,
  items,
  showAccount,
  onToggleDone,
  onEdit,
  onDelete,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  titleColor: string;
  items: ActivityWithRelations[];
  showAccount?: boolean;
  onToggleDone: (activity: ActivityWithRelations) => void;
  onEdit?: (activity: ActivityWithRelations) => void;
  onDelete: (id: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${titleColor}`} />
        <span className={`text-xs font-semibold uppercase tracking-wide ${titleColor}`}>
          {title}
        </span>
        <span className="text-xs text-muted-foreground">({items.length})</span>
      </div>
      <div className="rounded-xl border bg-card shadow-sm divide-y">
        {items.map((a) => (
          <ActivityRow
            key={a.id}
            activity={a}
            showAccount={showAccount}
            onToggleDone={onToggleDone}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

export function ActivityCardList({
  activities,
  showAccount,
  onToggleDone,
  onEdit,
  onDelete,
  emptyAction,
  emptyIcon,
}: ActivityCardListProps) {
  const { due, planned, done } = useMemo(() => {
    const now = new Date();
    const groups = {
      due: [] as ActivityWithRelations[],
      planned: [] as ActivityWithRelations[],
      done: [] as ActivityWithRelations[],
    };

    const sorted = [...activities].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    for (const a of sorted) {
      if (a.is_done) {
        groups.done.push(a);
      } else if (new Date(a.date) < now) {
        groups.due.push(a);
      } else {
        groups.planned.push(a);
      }
    }

    // Done sorted newest first
    groups.done.reverse();

    return groups;
  }, [activities]);

  if (activities.length === 0) {
    const Icon = emptyIcon ?? Clock;
    return (
      <div className="rounded-xl border bg-card shadow-sm">
        <EmptyState icon={Icon} title="Geen activiteiten gevonden" action={emptyAction} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Due + Planned side by side */}
      {(due.length > 0 || planned.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActivityTable
            title="Te doen"
            icon={Clock}
            titleColor="text-muted-foreground"
            items={due}
            showAccount={showAccount}
            onToggleDone={onToggleDone}
            onEdit={onEdit}
            onDelete={onDelete}
          />
          <ActivityTable
            title="Gepland"
            icon={Clock}
            titleColor="text-primary-action"
            items={planned}
            showAccount={showAccount}
            onToggleDone={onToggleDone}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      )}

      {/* Done */}
      <ActivityTable
        title="Afgerond"
        icon={CheckCircle2}
        titleColor="text-muted-foreground"
        items={done}
        showAccount={showAccount}
        onToggleDone={onToggleDone}
        onDelete={onDelete}
      />
    </div>
  );
}
