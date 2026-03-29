'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { useDealForm } from '@/features/deals/components/deal-form-context';

export function ConsultancyFields() {
  const { state, actions, meta } = useDealForm();
  if (!meta.isConsultancy) return null;

  return (
    <>
      <div className="space-y-1.5">
        <Label>Bench consultant</Label>
        <Select value={state.consultantId} onValueChange={(v) => actions.setConsultantId(v ?? '')}>
          <SelectTrigger>
            {state.benchConsultants.find((c) => c.id === state.consultantId)?.name ?? '— Selecteer consultant —'}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">— Selecteer consultant —</SelectItem>
            {state.benchConsultants.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Rol bij klant</Label>
        <Input
          value={state.consultantRole}
          onChange={(e) => actions.setConsultantRole(e.target.value)}
          placeholder="bv. Dev Senior, Business Analist..."
        />
      </div>
    </>
  );
}
