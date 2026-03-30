'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import type { ReferenceOption } from '@/features/accounts/types';

export type HostingEntry = {
  id?: string;
  provider_id: string;
  provider_name: string;
  environment_id: string;
  environment_name: string;
  url: string;
  notes: string;
};

type Props = {
  entries: HostingEntry[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, updates: Partial<HostingEntry>) => void;
  providers: ReferenceOption[];
  environments: ReferenceOption[];
};

export function AccountFormHostingSection({ entries, onAdd, onRemove, onUpdate, providers, environments }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Hosting</Label>
        <Button type="button" variant="ghost" size="sm" onClick={onAdd}>
          <Plus className="h-4 w-4 mr-1" /> Hosting toevoegen
        </Button>
      </div>
      {entries.map((entry, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: dynamically added rows with no stable identity
        <div key={index} className="rounded-lg border bg-card p-3 shadow-sm space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Select
                value={entry.provider_id || undefined}
                onValueChange={(v) => {
                  if (!v) return;
                  const found = providers.find((o) => o.id === v);
                  onUpdate(index, { provider_id: v, provider_name: found?.name ?? '' });
                }}
              >
                <SelectTrigger>
                  {entry.provider_name || <span className="text-muted-foreground">Provider...</span>}
                </SelectTrigger>
                <SelectContent>
                  {providers.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-36">
              <Select
                value={entry.environment_id || undefined}
                onValueChange={(v) => {
                  const found = environments.find((o) => o.id === v);
                  onUpdate(index, { environment_id: v ?? '', environment_name: found?.name ?? '' });
                }}
              >
                <SelectTrigger>
                  {entry.environment_name || <span className="text-muted-foreground">Omgeving</span>}
                </SelectTrigger>
                <SelectContent>
                  {environments.map((env) => (
                    <SelectItem key={env.id} value={env.id}>
                      {env.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(index)} className="shrink-0">
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
          <Input value={entry.url} onChange={(e) => onUpdate(index, { url: e.target.value })} placeholder="URL" />
          <Input
            value={entry.notes}
            onChange={(e) => onUpdate(index, { notes: e.target.value })}
            placeholder="Notitie"
          />
        </div>
      ))}
    </div>
  );
}
