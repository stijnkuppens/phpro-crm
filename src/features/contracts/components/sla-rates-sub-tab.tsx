'use client';

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Pencil, Plus, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { SlaRateWithTools } from '../types';
import { formatEUR } from '@/lib/format';

type Props = {
  slaRates: SlaRateWithTools[];
  hasServiceContract?: boolean;
  onEditYear: (year: number) => void;
};

export function SlaRatesSubTab({ slaRates, hasServiceContract, onEditYear }: Props) {
  const sorted = useMemo(() => [...slaRates].sort((a, b) => b.year - a.year).slice(0, 3), [slaRates]);

  // Collect all unique tool names across years — must be before early return to keep hook order stable
  const allToolNames = useMemo(() => {
    const names = new Set<string>();
    for (const sla of sorted) {
      for (const t of sla.tools ?? []) names.add(t.tool_name);
    }
    return Array.from(names).sort();
  }, [sorted]);

  if (sorted.length === 0) {
    return (
      <div className="py-8 text-center space-y-3">
        <p className="text-muted-foreground">Geen SLA tarieven geconfigureerd.</p>
        <Button variant="outline" size="sm" onClick={() => onEditYear(new Date().getFullYear())}>
          <Plus className="h-4 w-4 mr-1.5" />
          SLA tarieven toevoegen
        </Button>
      </div>
    );
  }

  const current = sorted[0];
  const prev = sorted[1];
  const toolCount = current.tools?.length ?? 0;

  const fixedDiff = prev ? Math.round((Number(current.fixed_monthly_rate) - Number(prev.fixed_monthly_rate)) * 100) / 100 : undefined;
  const supportDiff = prev ? Math.round((Number(current.support_hourly_rate) - Number(prev.support_hourly_rate)) * 100) / 100 : undefined;

  function getToolPrice(sla: SlaRateWithTools, name: string): number | null {
    const tool = sla.tools?.find((t) => t.tool_name === name);
    return tool ? Number(tool.monthly_price) : null;
  }

  // Calculate totals per year (fixed + tools, excl. support hourly)
  function getYearTotal(sla: SlaRateWithTools): number {
    const toolsTotal = (sla.tools ?? []).reduce((sum, t) => sum + Number(t.monthly_price), 0);
    return Number(sla.fixed_monthly_rate) + toolsTotal;
  }

  return (
    <div className="space-y-4 mt-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <span className="text-muted-foreground">○</span>
          SLA Tarieven
        </h3>
        {hasServiceContract && (
          <Badge className="bg-primary/15 text-primary-action border-0 text-xs">Service Contract actief</Badge>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-primary-action">Vast maandtarief</div>
            <div className="text-2xl font-bold mt-1">{formatEUR(Number(current.fixed_monthly_rate))}</div>
            <div className="text-xs text-primary-action">{current.year}{current.year === new Date().getFullYear() ? ' (huidig)' : ''}</div>
            {fixedDiff != null && fixedDiff !== 0 && (
              <span className={`text-xs font-medium ${fixedDiff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {fixedDiff > 0 ? '+' : ''}{fixedDiff}
              </span>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-primary-action">Support uurtarief</div>
            <div className="text-2xl font-bold mt-1">{formatEUR(Number(current.support_hourly_rate))}/u</div>
            <div className="text-xs text-primary-action">{current.year}{current.year === new Date().getFullYear() ? ' (huidig)' : ''}</div>
            {supportDiff != null && supportDiff !== 0 && (
              <span className={`text-xs font-medium ${supportDiff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {supportDiff > 0 ? '+' : ''}{supportDiff}
              </span>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-primary-action">Aantal tools</div>
            <div className="text-2xl font-bold mt-1">{toolCount}</div>
            <div className="text-xs text-primary-action">actieve tools/modules</div>
          </CardContent>
        </Card>
      </div>

      {/* Multi-year comparison table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left p-3 font-medium">Kostenpost</th>
              {sorted.map((sla, i) => (
                <th key={sla.year} className={`text-right p-3 font-medium ${i === 0 ? 'bg-primary/5' : ''}`}>
                  <div className="flex items-center justify-end gap-1.5">
                    {sla.year}
                    {sla.year === new Date().getFullYear() && <span className="text-[10px] text-primary-action font-normal">Huidig</span>}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-primary-action hover:bg-primary/10"
                      onClick={() => onEditYear(sla.year)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </div>
                </th>
              ))}
              <th className="text-right p-3 font-medium">Evolutie</th>
            </tr>
          </thead>
          <tbody>
            {/* Fixed monthly */}
            <RateRow
              label="Vast maandtarief"
              values={sorted.map((s) => Number(s.fixed_monthly_rate))}
            />
            {/* Support hourly */}
            <RateRow
              label="Support uurtarief"
              values={sorted.map((s) => Number(s.support_hourly_rate))}
              suffix="/u"
            />
            {/* Tools section header */}
            {allToolNames.length > 0 && (
              <tr className="border-b bg-muted/20">
                <td colSpan={sorted.length + 2} className="p-3 font-medium text-xs">
                  <span className="inline-flex items-center gap-1.5">
                    <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                    Tools & Modules
                  </span>
                </td>
              </tr>
            )}
            {/* Tool rows */}
            {allToolNames.map((name) => (
              <RateRow
                key={name}
                label={name}
                values={sorted.map((s) => getToolPrice(s, name))}
                indent
                suffix="/m"
              />
            ))}
            {/* Totals row */}
            <tr className="border-t-2 font-semibold">
              <td className="p-3">Totaal / maand (excl. support)</td>
              {sorted.map((sla, i) => (
                <td key={sla.year} className={`p-3 text-right ${i === 0 ? 'bg-primary/5' : ''}`}>
                  {formatEUR(getYearTotal(sla))}
                </td>
              ))}
              <td className="p-3 text-right">
                {sorted.length >= 2 && (() => {
                  const diff = getYearTotal(sorted[0]) - getYearTotal(sorted[1]);
                  return diff !== 0 ? (
                    <span className={diff > 0 ? 'text-green-600' : 'text-red-600'}>
                      {diff > 0 ? '+' : ''}€ {Math.abs(diff).toLocaleString('nl-BE')}
                    </span>
                  ) : '—';
                })()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RateRow({ label, values, indent, suffix }: { label: string; values: (number | null)[]; indent?: boolean; suffix?: string }) {
  const firstVal = values[0];
  const secondVal = values[1];
  const evolutionDiff = firstVal != null && secondVal != null ? Math.round((firstVal - secondVal) * 100) / 100 : undefined;

  return (
    <tr className="border-b last:border-0 hover:bg-muted/20">
      <td className={`p-3 ${indent ? 'pl-8 text-muted-foreground' : ''}`}>
        {indent && <Wrench className="h-3 w-3 inline mr-1.5 text-muted-foreground/50" />}
        {label}
      </td>
      {values.map((val, i) => (
        <td key={i} className={`p-3 text-right ${i === 0 ? 'bg-primary/5' : ''}`}>
          {val != null ? (
            <span>{formatEUR(val)}{suffix}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </td>
      ))}
      <td className="p-3 text-right">
        {evolutionDiff != null && evolutionDiff !== 0 ? (
          <span className={`text-[11px] font-medium ${evolutionDiff > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {evolutionDiff > 0 ? '+' : ''}{evolutionDiff}
          </span>
        ) : (
          firstVal != null && secondVal == null ? (
            <span className={`text-[11px] font-medium text-green-600`}>+{firstVal}</span>
          ) : null
        )}
      </td>
    </tr>
  );
}
