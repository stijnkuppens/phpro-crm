'use client';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ConsultancyFields } from '@/features/deals/components/deal-form-consultancy-fields';
import { useDealForm } from '@/features/deals/components/deal-form-context';
import { CronosDetailsSection } from '@/features/deals/components/deal-form-cronos-section';
import { DEAL_TAGS, LEAD_SOURCES } from '@/features/deals/components/deal-form-provider';
import { cn } from '@/lib/utils';

export function DealFormRightColumn() {
  const { state, actions, meta } = useDealForm();

  return (
    <div className="space-y-4">
      {/* Consultant fields (consultancy pipeline only) */}
      <ConsultancyFields />

      {/* Contact */}
      <div className="space-y-1.5">
        <Label>Contact</Label>
        <Select value={state.contactId} onValueChange={(v) => actions.setContactId(v ?? '')}>
          <SelectTrigger>
            {state.contacts.find((c) => c.id === state.contactId)?.name ?? '— Selecteer contact —'}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">— Selecteer contact —</SelectItem>
            {state.contacts.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lead bron */}
      <div className="space-y-1.5">
        <Label>Lead bron</Label>
        <Select value={state.leadSource} onValueChange={(v) => actions.setLeadSource(v ?? '')}>
          <SelectTrigger>{state.leadSource || '— Selecteer bron —'}</SelectTrigger>
          <SelectContent>
            <SelectItem value="">— Selecteer bron —</SelectItem>
            {LEAD_SOURCES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Herkomst toggle buttons */}
      <div className="space-y-1.5">
        <Label>Herkomst</Label>
        <div className="flex gap-2">
          {(
            [
              ['rechtstreeks', 'Rechtstreeks'],
              ['cronos', 'Via Cronos'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => actions.setOrigin(value)}
              className={cn(
                'flex-1 py-2 text-xs font-medium rounded-lg border transition-colors',
                state.origin === value
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-background border-border text-muted-foreground hover:bg-muted',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Cronos details (conditional) */}
      <CronosDetailsSection />

      {/* Beschrijving */}
      <div className="space-y-1.5">
        <Label>Beschrijving</Label>
        <Textarea
          rows={state.origin === 'cronos' ? 2 : 4}
          value={state.description}
          onChange={(e) => actions.setDescription(e.target.value)}
          placeholder="Omschrijving van de deal..."
        />
      </div>

      {/* Tags / Services (non-consultancy only) */}
      {!meta.isConsultancy && (
        <div className="space-y-1.5">
          <Label>Tags / Services</Label>
          <div className="flex flex-wrap gap-1.5">
            {DEAL_TAGS.map((tag) => {
              const active = state.tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => actions.toggleTag(tag)}
                  className={cn(
                    'px-2.5 py-1 text-xs font-medium rounded-full border transition-all',
                    active
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-primary',
                  )}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
