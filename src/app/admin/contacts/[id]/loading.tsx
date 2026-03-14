import { Skeleton } from '@/components/ui/skeleton';

export default function ContactDetailLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-[500px] w-full" />
    </div>
  );
}
