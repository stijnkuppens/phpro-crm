'use client';

import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { AccountSearchField } from '@/features/deals/components/deal-form-account-search';
import { useDealForm } from '@/features/deals/components/deal-form-context';

export function DealFormLeftColumn() {
  const { state, actions, meta } = useDealForm();

  return (
    <div className="space-y-4">
      {/* Titel */}
      <div className="space-y-1.5">
        <Label>Titel *</Label>
        <Input value={state.title} onChange={(e) => actions.setTitle(e.target.value)} placeholder="Deal naam" />
      </div>

      {/* Account */}
      <AccountSearchField />

      {/* Pipeline */}
      <div className="space-y-1.5">
        <Label>Pipeline *</Label>
        <Select value={state.pipelineId} onValueChange={actions.handlePipelineChange}>
          <SelectTrigger>{meta.activePipeline?.name ?? 'Selecteer...'}</SelectTrigger>
          <SelectContent>
            {meta.pipelines.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stage */}
      <div className="space-y-1.5">
        <Label>Stage *</Label>
        <Select value={state.stageId} onValueChange={actions.handleStageChange}>
          <SelectTrigger>{meta.sortedStages.find((s) => s.id === state.stageId)?.name ?? 'Selecteer...'}</SelectTrigger>
          <SelectContent>
            {meta.sortedStages.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Amount fields — conditional on pipeline type */}
      {meta.isConsultancy ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Gewenst tarief (€/u)</Label>
            <Input
              type="number"
              min="0"
              value={state.tariefGewenst}
              onChange={(e) => actions.setTariefGewenst(e.target.value)}
              placeholder="bv. 95"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Aangeboden tarief (€/u)</Label>
            <Input
              type="number"
              min="0"
              value={state.tariefAangeboden}
              onChange={(e) => actions.setTariefAangeboden(e.target.value)}
              placeholder="bv. 110"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label>Waarde (€)</Label>
          <Input type="number" min="0" value={state.amount} onChange={(e) => actions.setAmount(e.target.value)} />
        </div>
      )}

      {/* Close date + Probability side by side */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Sluitdatum</Label>
          <DatePicker value={state.closeDate} onChange={actions.setCloseDate} />
        </div>
        <div className="space-y-1.5">
          <Label>Kans %</Label>
          <Input
            type="number"
            min="0"
            max="100"
            value={state.probability}
            onChange={(e) => actions.setProbability(e.target.value)}
          />
        </div>
      </div>

      {/* Owner */}
      <div className="space-y-1.5">
        <Label>Eigenaar</Label>
        <Select value={state.ownerId} onValueChange={(v) => actions.setOwnerId(v ?? '')}>
          <SelectTrigger>{meta.owners.find((o) => o.id === state.ownerId)?.name ?? '— geen —'}</SelectTrigger>
          <SelectContent>
            <SelectItem value="">— geen —</SelectItem>
            {meta.owners.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
