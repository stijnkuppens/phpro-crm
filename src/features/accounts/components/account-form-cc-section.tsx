'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import type { ReferenceOption } from '@/features/accounts/types';

export type CompetenceCenterEntry = {
  id?: string;
  competence_center_id: string;
  competence_center_name: string;
  service_ids: string[];
};

type Props = {
  entries: CompetenceCenterEntry[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, updates: Partial<CompetenceCenterEntry>) => void;
  onToggleService: (index: number, serviceId: string) => void;
  competenceCenters: ReferenceOption[];
  ccServices: ReferenceOption[];
};

export function AccountFormCCSection({
  entries,
  onAdd,
  onRemove,
  onUpdate,
  onToggleService,
  competenceCenters: ccOptions,
  ccServices,
}: Props) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Andere Competence Centers</Label>
        <Button type="button" variant="ghost" size="sm" onClick={onAdd}>
          <Plus className="h-4 w-4 mr-1" /> CC toevoegen
        </Button>
      </div>
      {entries.map((cc, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: dynamically added rows with no stable identity
        <div key={index} className="rounded-lg border bg-card p-3 shadow-sm space-y-2">
          <div className="flex items-center gap-2">
            <Select
              value={cc.competence_center_id || undefined}
              onValueChange={(v) => {
                if (!v) return;
                const found = ccOptions.find((o) => o.id === v);
                onUpdate(index, {
                  competence_center_id: v,
                  competence_center_name: found?.name ?? '',
                });
              }}
            >
              <SelectTrigger>
                {cc.competence_center_name || (
                  <span className="text-muted-foreground">Selecteer CC...</span>
                )}
              </SelectTrigger>
              <SelectContent>
                {ccOptions.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRemove(index)}
              className="shrink-0"
            >
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ccServices.map((service) => (
              <button
                key={service.id}
                type="button"
                onClick={() => onToggleService(index, service.id)}
                className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
                  cc.service_ids.includes(service.id)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:bg-accent'
                }`}
              >
                {service.name}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
