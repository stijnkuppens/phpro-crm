'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { moveDealStage } from '../actions/move-deal-stage';
import { CloseDealModal } from './close-deal-modal';
import type { DealCard } from '../types';
import { formatEUR } from '@/lib/format';
import { Avatar } from '@/components/admin/avatar';

type Stage = {
  id: string;
  name: string;
  color: string;
  sort_order: number;
  is_closed: boolean;
  is_won?: boolean;
  is_longterm?: boolean;
};

type Props = {
  stages: Stage[];
  deals: DealCard[];
  onRefresh: () => void;
  onCreateDeal?: (stageId: string) => void;
};

function DroppableColumn({
  stage,
  children,
  onCreateDeal,
  dealCount,
  stageTotal,
}: {
  stage: Stage;
  children: React.ReactNode;
  onCreateDeal?: (stageId: string) => void;
  dealCount: number;
  stageTotal: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  return (
    <div
      ref={setNodeRef}
      className={cn('w-72 shrink-0 rounded-lg p-3 transition-colors', isOver && 'ring-2 ring-primary/30')}
      style={{
        backgroundColor: isOver ? `${stage.color}15` : '#f9fafb',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
          <h3 className="text-sm font-semibold">{stage.name}</h3>
          <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">{dealCount}</span>
        </div>
        <span className="text-xs text-muted-foreground">{formatEUR(stageTotal)}</span>
      </div>
      <div className="space-y-2 min-h-[100px]">{children}</div>
      {onCreateDeal && (
        <button
          onClick={() => onCreateDeal(stage.id)}
          className="w-full py-2 text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg border border-dashed border-muted-foreground/25 transition-colors mt-2"
        >
          + Deal
        </button>
      )}
    </div>
  );
}

function DraggableDealCard({ deal, onNavigate }: { deal: DealCard; onNavigate: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
    data: deal,
  });

  const style = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => !isDragging && onNavigate(deal.id)}
      className="cursor-grab active:cursor-grabbing rounded-xl border bg-card p-3 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="text-sm font-medium mb-1 truncate">{deal.title}</div>
      <div className="text-xs text-muted-foreground mb-1">{deal.account_name}</div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="font-semibold">{formatEUR(deal.amount)}</span>
        {deal.close_date && (
          <span className="text-muted-foreground">
            {new Date(deal.close_date).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          {deal.lead_source && <span className="text-muted-foreground">{deal.lead_source}</span>}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">{deal.probability}%</span>
          {deal.owner_name && (
            <Avatar fallback={deal.owner_name.split(' ').filter(Boolean).map((w) => w[0]).join('').toUpperCase().slice(0, 2)} size="xs" />
          )}
        </div>
      </div>
    </div>
  );
}

function CloseDropZone({ id, label, color }: { id: string; label: string; color: 'green' | 'red' | 'amber' }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const styles = {
    green: { border: 'border-green-300', bg: isOver ? 'bg-green-50' : '', text: 'text-green-600', dot: 'bg-green-500' },
    red: { border: 'border-red-300', bg: isOver ? 'bg-red-50' : '', text: 'text-red-600', dot: 'bg-red-500' },
    amber: { border: 'border-amber-300', bg: isOver ? 'bg-amber-50' : '', text: 'text-amber-600', dot: 'bg-amber-500' },
  };
  const s = styles[color];
  return (
    <div ref={setNodeRef} className={cn('flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed transition-colors', s.border, s.bg)}>
      <span className={cn('h-2 w-2 rounded-full', s.dot)} />
      <span className={cn('text-sm font-medium', s.text)}>{label}</span>
    </div>
  );
}

export function DealKanban({ stages, deals, onRefresh, onCreateDeal }: Props) {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [closeDealData, setCloseDealData] = useState<{ dealId: string; type: 'won' | 'lost' | 'longterm' } | null>(null);

  const openStages = stages
    .filter((s) => !s.is_closed)
    .sort((a, b) => a.sort_order - b.sort_order);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function handleDragEnd(event: DragEndEvent) {
    setIsDragging(false);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const dealId = active.id as string;
    const targetId = over.id as string;

    if (targetId === 'close-won') {
      setCloseDealData({ dealId, type: 'won' });
      return;
    }
    if (targetId === 'close-lost') {
      setCloseDealData({ dealId, type: 'lost' });
      return;
    }
    if (targetId === 'close-longterm') {
      setCloseDealData({ dealId, type: 'longterm' });
      return;
    }

    // Normal stage move
    const result = await moveDealStage(dealId, targetId);
    if ('error' in result && result.error) {
      toast.error(typeof result.error === 'string' ? result.error : 'Verplaatsen mislukt');
    }
    onRefresh();
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 mt-4">
        {openStages.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage_id === stage.id);
          const stageTotal = stageDeals.reduce((sum, d) => sum + d.amount, 0);
          return (
            <DroppableColumn
              key={stage.id}
              stage={stage}
              onCreateDeal={onCreateDeal}
              dealCount={stageDeals.length}
              stageTotal={stageTotal}
            >
              {stageDeals.map((deal) => (
                <DraggableDealCard
                  key={deal.id}
                  deal={deal}
                  onNavigate={(id) => router.push(`/admin/deals/${id}`)}
                />
              ))}
            </DroppableColumn>
          );
        })}
      </div>

      {isDragging && (
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-dashed">
          <span className="text-xs text-muted-foreground shrink-0 hidden lg:block">Sleep hier om af te sluiten &rarr;</span>
          <CloseDropZone id="close-won" label="Gewonnen" color="green" />
          <CloseDropZone id="close-lost" label="Verloren" color="red" />
          <CloseDropZone id="close-longterm" label="Longterm" color="amber" />
        </div>
      )}

      {closeDealData && (
        <CloseDealModal
          dealId={closeDealData.dealId}
          open
          onOpenChange={(v) => { if (!v) setCloseDealData(null); }}
          onSuccess={() => { setCloseDealData(null); onRefresh(); }}
          initialType={closeDealData.type}
        />
      )}
    </DndContext>
  );
}
