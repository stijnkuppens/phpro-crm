import { Skeleton } from '@/components/ui/skeleton';

export default function AccountDetailLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-28" />
        ))}
      </div>
      <Skeleton className="h-[500px] w-full" />
    </div>
  );
}
