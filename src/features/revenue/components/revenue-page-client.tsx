'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RevenueEntry, RevenueClientFull, DivisionWithServices } from '../types';
import { formatEUR } from '@/lib/format';

type Props = {
  clients: RevenueClientFull[];
  divisions: DivisionWithServices[];
  entries: RevenueEntry[];
  years: number[];
};

const MONTHS = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];

export function RevenuePageClient({ clients, divisions, entries, years }: Props) {
  const [selectedYear, setSelectedYear] = useState(years[years.length - 1] ?? new Date().getFullYear());
  const [divFilter, setDivFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'client' | 'service'>('client');

  const yearEntries = useMemo(
    () => entries.filter((e) => e.year === selectedYear && (divFilter === 'all' || e.division_id === divFilter)),
    [entries, selectedYear, divFilter],
  );

  const clientTotals = useMemo(() => {
    const totals: Record<string, { total: number; months: number[] }> = {};
    for (const client of clients) {
      totals[client.id] = { total: 0, months: Array(12).fill(0) };
    }
    for (const e of yearEntries) {
      if (totals[e.revenue_client_id]) {
        totals[e.revenue_client_id].total += Number(e.amount);
        totals[e.revenue_client_id].months[e.month] += Number(e.amount);
      }
    }
    return totals;
  }, [clients, yearEntries]);

  const grandTotal = Object.values(clientTotals).reduce((s, c) => s + c.total, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center">
        <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
          <SelectTrigger className="w-28">
            {selectedYear}
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          <Button
            variant={divFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDivFilter('all')}
          >
            Alle
          </Button>
          {divisions.map((d) => (
            <Button
              key={d.id}
              variant={divFilter === d.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDivFilter(d.id)}
              style={divFilter === d.id ? { backgroundColor: d.color ?? undefined } : {}}
            >
              {d.name}
            </Button>
          ))}
        </div>
        <div className="flex gap-1 ml-auto">
          <Button
            variant={viewMode === 'client' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('client')}
          >
            Client
          </Button>
          <Button
            variant={viewMode === 'service' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('service')}
          >
            Service
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Totaal: {formatEUR(grandTotal)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 sticky left-0 bg-card min-w-[190px]">
                    {viewMode === 'client' ? 'Client' : 'Service'}
                  </th>
                  {MONTHS.map((m) => (
                    <th key={m} className="text-right p-2 min-w-[78px]">{m}</th>
                  ))}
                  <th className="text-right p-2 min-w-[90px] font-bold">Totaal</th>
                </tr>
              </thead>
              <tbody>
                {viewMode === 'client' &&
                  clients
                    .filter((c) => (clientTotals[c.id]?.total ?? 0) > 0)
                    .sort((a, b) => (clientTotals[b.id]?.total ?? 0) - (clientTotals[a.id]?.total ?? 0))
                    .map((client) => {
                      const ct = clientTotals[client.id];
                      return (
                        <tr key={client.id} className="border-b hover:bg-muted/50">
                          <td className="p-2 sticky left-0 bg-card font-medium">{client.name}</td>
                          {ct.months.map((m, i) => (
                            <td key={i} className="text-right p-2 tabular-nums">{m > 0 ? formatEUR(m) : ''}</td>
                          ))}
                          <td className="text-right p-2 font-bold tabular-nums">{formatEUR(ct.total)}</td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
