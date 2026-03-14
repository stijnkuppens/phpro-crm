import { Skeleton } from '@/components/ui/skeleton';

export default function ConsultantsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-[500px] w-full" />
    </div>
  );
}
