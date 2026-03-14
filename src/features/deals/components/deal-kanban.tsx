'use client';

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
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { moveDealStage } from '../actions/move-deal-stage';
import type { DealCard } from '../types';

type Stage = {
  id: string;
  name: string;
  color: string;
  sort_order: number;
  is_closed: boolean;
};

type Props = {
  stages: Stage[];
  deals: DealCard[];
  onRefresh: () => void;
};

function DroppableColumn({ stage, children }: { stage: Stage; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  return (
    <div
      ref={setNodeRef}
      className="w-72 shrink-0 rounded-lg p-3"
      style={{
        backgroundColor: isOver ? `${stage.color}15` : '#f9fafb',
        borderTop: `3px solid ${stage.color}`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">{stage.name}</h3>
      </div>
      <div className="space-y-2 min-h-[100px]">{children}</div>
    </div>
  );
}

function DraggableDealCard({ deal }: { deal: DealCard }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
    data: deal,
  });

  const style = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

  return (
    <Card ref={setNodeRef} style={style} {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing">
      <CardContent className="p-3">
        <div className="text-sm font-medium mb-1">{deal.title}</div>
        <div className="text-xs text-muted-foreground mb-1">{deal.account_name}</div>
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold">{fmt(deal.amount)}</span>
          <span>{deal.probability}%</span>
        </div>
        {deal.forecast_category && (
          <Badge variant="outline" className="mt-1 text-[10px]">{deal.forecast_category}</Badge>
        )}
      </CardContent>
    </Card>
  );
}

export function DealKanban({ stages, deals, onRefresh }: Props) {
  const openStages = stages
    .filter((s) => !s.is_closed)
    .sort((a, b) => a.sort_order - b.sort_order);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const dealId = active.id as string;
    const newStageId = over.id as string;

    const result = await moveDealStage(dealId, newStageId);
    if ('error' in result && result.error) {
      toast.error(typeof result.error === 'string' ? result.error : 'Verplaatsen mislukt');
    }
    onRefresh();
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {openStages.map((stage) => (
          <DroppableColumn key={stage.id} stage={stage}>
            {deals
              .filter((d) => d.stage_id === stage.id)
              .map((deal) => (
                <DraggableDealCard key={deal.id} deal={deal} />
              ))}
          </DroppableColumn>
        ))}
      </div>
    </DndContext>
  );
}
