'use client';

import { RotateCcw } from 'lucide-react';
import { useDealForm } from '@/features/deals/components/deal-form-context';
import { cn } from '@/lib/utils';

export function ClosedDealBanner() {
  const { meta, actions } = useDealForm();
  if (!meta.isClosed || !meta.deal) return null;
  const { deal } = meta;

  return (
    <div
      className={cn(
        'mb-4 rounded-xl px-4 py-3 text-sm font-medium flex items-center justify-between gap-3',
        deal.closed_type === 'won' &&
          'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
        deal.closed_type === 'lost' &&
          'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
        deal.closed_type === 'longterm' &&
          'bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200',
      )}
    >
      <span>
        {deal.closed_type === 'won' && '✓ Gewonnen'}
        {deal.closed_type === 'lost' && '✗ Verloren'}
        {deal.closed_type === 'longterm' && '⏸ Longterm / On hold'}
        {deal.closed_reason && ` — ${deal.closed_reason}`}
      </span>
      <button
        type="button"
        onClick={actions.handleReopen}
        className="flex items-center gap-1 text-xs underline opacity-80 hover:opacity-100 whitespace-nowrap"
      >
        <RotateCcw className="h-3 w-3" />
        Heropen
      </button>
    </div>
  );
}
