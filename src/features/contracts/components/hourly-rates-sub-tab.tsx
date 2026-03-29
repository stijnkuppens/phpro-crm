'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/admin/empty-state';
import type { HourlyRate } from '../types';
import { formatEUR } from '@/lib/format';

type Props = {
  hourlyRates: HourlyRate[];
};

export function HourlyRatesSubTab({ hourlyRates }: Props) {
  const currentYear = new Date().getFullYear();
  const [windowStart, setWindowStart] = useState(currentYear);
  const visibleYears = [windowStart, windowStart - 1, windowStart - 2];

  const { roles, rateMap } = useMemo(() => {
    const map = new Map<string, Map<number, number>>();

    for (const r of hourlyRates) {
      if (!map.has(r.role)) map.set(r.role, new Map());
      map.get(r.role)!.set(r.year, Number(r.rate));
    }

    const sortedRoles = Array.from(map.keys()).sort();
    return { roles: sortedRoles, rateMap: map };
  }, [hourlyRates]);

  if (roles.length === 0) {
    return <EmptyState icon={CreditCard} title="Geen uurtarieven geconfigureerd." />;
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <span className="text-muted-foreground">€</span>
          Afgesproken uurtarieven
        </h3>
        <div className="flex items-center gap-2">
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
      </div>
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left p-3 font-medium">Rol</th>
              {visibleYears.map((year) => (
                <th key={year} className={`text-right p-3 font-medium ${year === currentYear ? 'bg-primary/5' : ''}`}>
                  <div className="flex items-center justify-end gap-1.5">
                    {year}
                    {year === currentYear && <span className="text-[10px] text-primary-action font-normal">Huidig</span>}
                  </div>
                </th>
              ))}
              <th className="text-right p-3 font-medium">Dag ({visibleYears[0]})</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => {
              const yearMap = rateMap.get(role)!;
              const latestRate = yearMap.get(visibleYears[0]);
              const prevRate = yearMap.get(visibleYears[1]);
              const diff = latestRate != null && prevRate != null ? Math.round(latestRate - prevRate) : undefined;
              const dailyRate = latestRate != null ? latestRate * 8 : undefined;

              return (
                <tr key={role} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="p-3">{role}</td>
                  {visibleYears.map((year, i) => {
                    const rate = yearMap.get(year);
                    return (
                      <td key={year} className={`p-3 text-right ${year === currentYear ? 'bg-primary/5' : ''}`}>
                        {rate != null ? (
                          <span className="inline-flex items-center gap-1.5">
                            {formatEUR(rate)}
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
                    {dailyRate != null ? formatEUR(dailyRate) : '—'}
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
