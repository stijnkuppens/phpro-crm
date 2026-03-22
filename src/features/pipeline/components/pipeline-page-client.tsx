'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/admin/stat-card';
import { DollarSign } from 'lucide-react';
import type { PipelineEntryWithDivision } from '../types';
import type { DivisionWithServices } from '@/features/revenue/types';
import { formatEUR } from '@/lib/format';

type Props = {
  entries: PipelineEntryWithDivision[];
  divisions: DivisionWithServices[];
  year: number;
};

const MONTHS = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];

export function PipelinePageClient({ entries, divisions, year }: Props) {
  const totalSold = entries.reduce((s, e) => s + Number(e.total), 0);

  const byDivision = useMemo(() => {
    const groups: Record<string, { name: string; color: string; entries: PipelineEntryWithDivision[]; total: number }> = {};
    for (const e of entries) {
      const divName = e.division?.name ?? 'Unknown';
      const divColor = e.division?.color ?? '#666';
      if (!groups[divName]) groups[divName] = { name: divName, color: divColor, entries: [], total: 0 };
      groups[divName].entries.push(e);
      groups[divName].total += Number(e.total);
    }
    return Object.values(groups);
  }, [entries]);

  function monthlySpread(entry: PipelineEntryWithDivision): number[] {
    const months = Array(12).fill(0);
    const monthlyAmount = Number(entry.total) / entry.duration;
    for (let i = 0; i < entry.duration; i++) {
      const m = entry.start_month + i;
      if (m < 12) months[m] += monthlyAmount;
    }
    return months;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title={`Totaal Sold ${year}`} value={formatEUR(totalSold)} icon={DollarSign} />
        {byDivision.map((d) => (
          <StatCard key={d.name} title={d.name} value={formatEUR(d.total)} icon={DollarSign} />
        ))}
      </div>
      {byDivision.map((divGroup) => (
        <Card key={divGroup.name}>
          <CardHeader>
            <CardTitle className="text-sm" style={{ color: divGroup.color }}>{divGroup.name} — {formatEUR(divGroup.total)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 min-w-[150px]">Client</th>
                    <th className="text-left p-2">Service</th>
                    <th className="text-right p-2">Totaal</th>
                    {MONTHS.map((m) => (<th key={m} className="text-right p-2 min-w-[60px]">{m}</th>))}
                  </tr>
                </thead>
                <tbody>
                  {divGroup.entries.map((entry) => {
                    const spread = monthlySpread(entry);
                    return (
                      <tr key={entry.id} className="border-b hover:bg-muted/50">
                        <td className="p-2">{entry.client}</td>
                        <td className="p-2">{entry.service_name}</td>
                        <td className="text-right p-2 font-medium tabular-nums">{formatEUR(Number(entry.total))}</td>
                        {spread.map((v, i) => (<td key={i} className="text-right p-2 tabular-nums text-xs">{v > 0 ? formatEUR(Math.round(v)) : ''}</td>))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
