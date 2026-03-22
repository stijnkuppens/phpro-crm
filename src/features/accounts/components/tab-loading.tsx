import { Skeleton } from '@/components/ui/skeleton';

/** Shared tab loading skeleton — used by all account tab routes */
export function TabLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-[400px] w-full rounded-xl" />
    </div>
  );
}
