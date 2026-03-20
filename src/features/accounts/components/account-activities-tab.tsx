'use client';

import type { ActivityWithRelations } from '@/features/activities/types';

type Props = {
  accountId: string;
  initialData: ActivityWithRelations[];
  initialCount: number;
};

export function AccountActivitiesTab({ accountId, initialData, initialCount }: Props) {
  return (
    <div className="py-8 text-center text-muted-foreground">
      Activiteiten tab — {initialData.length} van {initialCount} geladen
    </div>
  );
}
