import { cn } from '@/lib/utils';

type HealthBarProps = {
  score: number;
};

export function HealthBar({ score }: HealthBarProps) {
  const color = score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-medium text-muted-foreground">{score}</span>
    </div>
  );
}
