'use client';

import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { SlaYearState, ToolEntry } from '@/features/contracts/types';

const SECTION_WHITE =
  '[&_input]:bg-white [&_[data-slot=select-trigger]]:bg-white [&_button[data-slot=button]]:bg-white dark:[&_input]:bg-background dark:[&_[data-slot=select-trigger]]:bg-background dark:[&_button[data-slot=button]]:bg-background';

type Props = {
  slaVisibleYears: number[];
  currentYear: number;
  getSlaState: (year: number) => SlaYearState;
  updateSlaField: (
    year: number,
    field: 'fixed_monthly_rate' | 'support_hourly_rate',
    value: string,
  ) => void;
  addSlaTool: (year: number) => void;
  removeSlaTool: (year: number, index: number) => void;
  updateSlaTool: (year: number, index: number, field: keyof ToolEntry, value: string) => void;
  setSlaWindowStart: (fn: (y: number) => number) => void;
};

export function ContractSlaRatesSection({
  slaVisibleYears,
  currentYear,
  getSlaState,
  updateSlaField,
  addSlaTool,
  removeSlaTool,
  updateSlaTool,
  setSlaWindowStart,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          SLA Tarieven
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" onClick={() => setSlaWindowStart((y) => y + 1)}>
            <ChevronLeft />
          </Button>
          <span className="text-xs text-muted-foreground tabular-nums">
            {slaVisibleYears[0]}&ndash;{slaVisibleYears[2]}
          </span>
          <Button variant="ghost" size="icon-sm" onClick={() => setSlaWindowStart((y) => y - 1)}>
            <ChevronRight />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {slaVisibleYears.map((year) => {
          const state = getSlaState(year);
          const isCurrentYear = year === currentYear;
          return (
            <div
              key={year}
              className={`rounded-xl border p-5 space-y-4 shadow-sm ${
                isCurrentYear ? `bg-primary/5 border-primary/20 ${SECTION_WHITE}` : 'bg-card'
              }`}
            >
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold">{year}</h3>
                {isCurrentYear && (
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary-action">
                    Huidig
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Vast maandtarief (&euro;/m)</Label>
                  <Input
                    type="number"
                    value={state.fixed_monthly_rate}
                    onChange={(e) => updateSlaField(year, 'fixed_monthly_rate', e.target.value)}
                    placeholder="0"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Support uurtarief (&euro;/u)</Label>
                  <Input
                    type="number"
                    value={state.support_hourly_rate}
                    onChange={(e) => updateSlaField(year, 'support_hourly_rate', e.target.value)}
                    placeholder="0"
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Tools */}
              <div className="space-y-2 border-t pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Tools & Modules</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => addSlaTool(year)}
                  >
                    <Plus /> Tool
                  </Button>
                </div>
                {state.tools.length > 0 && (
                  <div className="space-y-1.5">
                    {state.tools.map((tool, i) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: dynamically added rows with no stable identity
                      <div key={i} className="flex items-center gap-1.5">
                        <Input
                          value={tool.tool_name}
                          onChange={(e) => updateSlaTool(year, i, 'tool_name', e.target.value)}
                          placeholder="Naam"
                          className="h-8 flex-1 text-xs"
                        />
                        <Input
                          type="number"
                          value={tool.monthly_price}
                          onChange={(e) => updateSlaTool(year, i, 'monthly_price', e.target.value)}
                          placeholder="&euro;/m"
                          className="h-8 w-20 text-right text-xs"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removeSlaTool(year, i)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
