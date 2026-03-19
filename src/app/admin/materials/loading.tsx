import { Skeleton } from '@/components/ui/skeleton';

export default function MaterialsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-[500px] w-full" />
    </div>
  );
}
