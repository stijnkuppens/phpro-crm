'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/admin/empty-state';
import type { SlaRateWithTools } from '../types';
import { formatEUR } from '@/lib/format';

type Props = {
  slaRates: SlaRateWithTools[];
  hasServiceContract?: boolean;
};

export function SlaRatesSubTab({ slaRates, hasServiceContract }: Props) {
  const currentYear = new Date().getFullYear();
  const [windowStart, setWindowStart] = useState(currentYear);
  const visibleYears = [windowStart, windowStart - 1, windowStart - 2];

  // Index rates by year for quick lookup
  const ratesByYear = useMemo(() => {
    const map = new Map<number, SlaRateWithTools>();
    for (const s of slaRates) map.set(s.year, s);
    return map;
  }, [slaRates]);

  // Collect all unique tool names across ALL years
  const allToolNames = useMemo(() => {
    const names = new Set<string>();
    for (const sla of slaRates) {
      for (const t of sla.tools ?? []) names.add(t.tool_name);
    }
    return Array.from(names).sort();
  }, [slaRates]);

  // Get visible data
  const visibleRates = visibleYears.map((y) => ratesByYear.get(y) ?? null);
  const current = visibleRates[0];
  const prev = visibleRates[1];
  const hasAnyData = slaRates.length > 0;

  if (!hasAnyData) {
    return <EmptyState icon={Wrench} title="Geen SLA tarieven geconfigureerd." />;
  }

  const toolCount = current?.tools?.length ?? 0;
  const fixedDiff = current && prev ? Math.round((Number(current.fixed_monthly_rate) - Number(prev.fixed_monthly_rate)) * 100) / 100 : undefined;
  const supportDiff = current && prev ? Math.round((Number(current.support_hourly_rate) - Number(prev.support_hourly_rate)) * 100) / 100 : undefined;

  function getToolPrice(sla: SlaRateWithTools | null, name: string): number | null {
    if (!sla) return null;
    const tool = sla.tools?.find((t) => t.tool_name === name);
    return tool ? Number(tool.monthly_price) : null;
  }

  function getYearTotal(sla: SlaRateWithTools | null): number {
    if (!sla) return 0;
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

      {/* Year navigation */}
      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" size="icon-sm" onClick={() => setWindowStart((y) => y + 1)}>
          <ChevronLeft />
        </Button>
        <span className="text-xs text-muted-foreground tabular-nums">
          {visibleYears[0]}–{visibleYears[2]}
        </span>
        <Button variant="ghost" size="icon-sm" onClick={() => setWindowStart((y) => y - 1)}>
          <ChevronRight />
        </Button>
      </div>

      {/* Year cards */}
      <div className="grid grid-cols-3 gap-4">
          {visibleYears.map((year, i) => {
            const sla = visibleRates[i];
            const prevSla = ratesByYear.get(year - 1);
            const fixed = sla ? Number(sla.fixed_monthly_rate) : 0;
            const support = sla ? Number(sla.support_hourly_rate) : 0;
            const tools = sla?.tools?.length ?? 0;
            const prevFixed = prevSla ? Number(prevSla.fixed_monthly_rate) : undefined;
            const fDiff = prevFixed != null && fixed ? Math.round((fixed - prevFixed) * 100) / 100 : undefined;

            return (
              <Card key={year} className={year === currentYear ? 'border-primary/30 bg-primary/5' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base font-bold">{year}</span>
                    {year === currentYear && (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary-action">
                        Huidig
                      </span>
                    )}
                  </div>
                  {sla ? (
                    <div className="space-y-1.5">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Vast</span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-semibold">{formatEUR(fixed)}</span>
                          {fDiff != null && fDiff !== 0 && (
                            <span className={`text-[10px] font-medium ${fDiff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {fDiff > 0 ? '+' : ''}{fDiff}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Support</span>
                        <span className="text-lg font-semibold">{formatEUR(support)}/u</span>
                      </div>
                      <div className="flex items-baseline justify-between pt-1 border-t">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Tools</span>
                        <span className="text-sm font-medium">{tools}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic mt-2">Geen data</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

      {/* Multi-year comparison table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left p-3 font-medium">Kostenpost</th>
              {visibleYears.map((year) => (
                <th key={year} className={`text-right p-3 font-medium ${year === currentYear ? 'bg-primary/5' : ''}`}>
                  <div className="flex items-center justify-end gap-1.5">
                    {year}
                    {year === currentYear && <span className="text-[10px] text-primary-action font-normal">Huidig</span>}
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
              values={visibleRates.map((s) => s ? Number(s.fixed_monthly_rate) : null)}
              currentYear={currentYear}
              years={visibleYears}
            />
            {/* Support hourly */}
            <RateRow
              label="Support uurtarief"
              values={visibleRates.map((s) => s ? Number(s.support_hourly_rate) : null)}
              suffix="/u"
              currentYear={currentYear}
              years={visibleYears}
            />
            {/* Tools section header */}
            {allToolNames.length > 0 && (
              <tr className="border-b bg-muted/20">
                <td colSpan={visibleYears.length + 2} className="p-3 font-medium text-xs">
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
                values={visibleRates.map((s) => getToolPrice(s, name))}
                indent
                suffix="/m"
                currentYear={currentYear}
                years={visibleYears}
              />
            ))}
            {/* Totals row */}
            <tr className="border-t-2 font-semibold">
              <td className="p-3">Totaal / maand (excl. support)</td>
              {visibleYears.map((year, i) => (
                <td key={year} className={`p-3 text-right ${year === currentYear ? 'bg-primary/5' : ''}`}>
                  {visibleRates[i] ? formatEUR(getYearTotal(visibleRates[i])) : <span className="text-muted-foreground">—</span>}
                </td>
              ))}
              <td className="p-3 text-right">
                {visibleRates[0] && visibleRates[1] && (() => {
                  const diff = getYearTotal(visibleRates[0]) - getYearTotal(visibleRates[1]);
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

function RateRow({ label, values, indent, suffix, currentYear, years }: {
  label: string;
  values: (number | null)[];
  indent?: boolean;
  suffix?: string;
  currentYear: number;
  years: number[];
}) {
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
        <td key={i} className={`p-3 text-right ${years[i] === currentYear ? 'bg-primary/5' : ''}`}>
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
            <span className="text-[11px] font-medium text-green-600">+{firstVal}</span>
          ) : null
        )}
      </td>
    </tr>
  );
}
