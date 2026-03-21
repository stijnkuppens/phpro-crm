'use client';

import { useMemo } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { HourlyRate } from '../types';

type Props = {
  hourlyRates: HourlyRate[];
  onEditYear: (year: number) => void;
};

const fmt = (n: number) =>
  new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

export function HourlyRatesSubTab({ hourlyRates, onEditYear }: Props) {
  const { roles, years, rateMap } = useMemo(() => {
    const map = new Map<string, Map<number, number>>();
    const yearSet = new Set<number>();

    for (const r of hourlyRates) {
      yearSet.add(r.year);
      if (!map.has(r.role)) map.set(r.role, new Map());
      map.get(r.role)!.set(r.year, Number(r.rate));
    }

    const sortedYears = Array.from(yearSet).sort((a, b) => b - a).slice(0, 3);
    const sortedRoles = Array.from(map.keys()).sort();

    return { roles: sortedRoles, years: sortedYears, rateMap: map };
  }, [hourlyRates]);

  if (years.length === 0) {
    return (
      <div className="py-8 text-center space-y-3">
        <p className="text-muted-foreground">Geen uurtarieven geconfigureerd.</p>
        <Button variant="outline" size="sm" onClick={() => onEditYear(new Date().getFullYear())}>
          <Plus className="h-4 w-4 mr-1.5" />
          Uurtarieven toevoegen
        </Button>
      </div>
    );
  }

  const latestYear = years[0];
  const prevYear = years[1];
  const calendarYear = new Date().getFullYear();

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <span className="text-muted-foreground">€</span>
          Afgesproken uurtarieven
        </h3>
        <Button variant="outline" size="sm" onClick={() => onEditYear(latestYear + 1)}>
          <Plus className="h-4 w-4 mr-1.5" />
          {latestYear + 1} toevoegen
        </Button>
      </div>
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left p-3 font-medium">Rol</th>
              {years.map((year, i) => (
                <th key={year} className={`text-right p-3 font-medium ${i === 0 ? 'bg-primary/5' : ''}`}>
                  <div className="flex items-center justify-end gap-1.5">
                    {year}
                    {year === calendarYear && <span className="text-[10px] text-primary-action font-normal">Huidig</span>}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-primary-action hover:bg-primary/10"
                      onClick={() => onEditYear(year)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </div>
                </th>
              ))}
              <th className="text-right p-3 font-medium">Dag ({latestYear})</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => {
              const yearMap = rateMap.get(role)!;
              const currentRate = yearMap.get(latestYear);
              const prevRate = prevYear ? yearMap.get(prevYear) : undefined;
              const diff = currentRate != null && prevRate != null ? Math.round(currentRate - prevRate) : undefined;
              const dailyRate = currentRate != null ? currentRate * 8 : undefined;

              return (
                <tr key={role} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="p-3">{role}</td>
                  {years.map((year, i) => {
                    const rate = yearMap.get(year);
                    return (
                      <td key={year} className={`p-3 text-right ${i === 0 ? 'bg-primary/5' : ''}`}>
                        {rate != null ? (
                          <span className="inline-flex items-center gap-1.5">
                            {fmt(rate)}
                            {i === 0 && diff != null && diff !== 0 && (
                              <span className={`text-[11px] font-medium ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {diff > 0 ? '+' : ''}{diff}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="p-3 text-right text-muted-foreground">
                    {dailyRate != null ? fmt(dailyRate) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
