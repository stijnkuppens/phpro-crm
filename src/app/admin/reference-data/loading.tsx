import { Skeleton } from '@/components/ui/skeleton';

export default function ReferenceDataLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-56" />
      <div className="flex gap-6">
        <div className="w-56 shrink-0 space-y-2">
          {Array.from({ length: 13 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton items with no identity
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
        <div className="flex-1 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    </div>
  );
}
