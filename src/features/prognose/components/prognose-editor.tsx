'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/admin/stat-card';
import { DollarSign, Save, TrendingUp, Users } from 'lucide-react';
import { toast } from 'sonner';
import { savePrognose } from '@/features/revenue/actions/save-prognose';
import type { RevenueClientFull, DivisionWithServices, RevenueEntry } from '@/features/revenue/types';
import type { PrognoseLine, PrognoseLineAction } from '../types';
import { formatEUR } from '@/lib/format';

type Props = {
  clients: RevenueClientFull[];
  divisions: DivisionWithServices[];
  entries: RevenueEntry[];
  forecastYear: number;
  lastKnownYear: number;
};

export function PrognoseEditor({ clients, divisions, entries, forecastYear, lastKnownYear }: Props) {
  const initialLines = useMemo(() => {
    const lines: PrognoseLine[] = [];
    for (const client of clients) {
      for (const svc of client.services) {
        const div = divisions.find((d) => d.id === svc.division_id);
        const lastYearEntries = entries.filter(
          (e) => e.revenue_client_id === client.id && e.division_id === svc.division_id && e.service_name === svc.service_name && e.year === lastKnownYear,
        );
        const lastKnownTotal = lastYearEntries.reduce((s, e) => s + Number(e.amount), 0);
        lines.push({
          clientId: client.id, clientName: client.name,
          divisionId: svc.division_id, divisionName: div?.name ?? '',
          serviceName: svc.service_name, lastKnownTotal,
          forecastTotal: lastKnownTotal, action: 'copy',
        });
      }
    }
    return lines;
  }, [clients, divisions, entries, lastKnownYear]);

  const [lines, setLines] = useState(initialLines);
  const [saving, setSaving] = useState(false);

  const { totalForecast, totalLastYear, consultancyTotal } = useMemo(() =>
    lines.reduce((acc, l) => ({
      totalForecast: acc.totalForecast + l.forecastTotal,
      totalLastYear: acc.totalLastYear + l.lastKnownTotal,
      consultancyTotal: acc.consultancyTotal + (l.serviceName.toLowerCase() === 'consultancy' ? l.forecastTotal : 0),
    }), { totalForecast: 0, totalLastYear: 0, consultancyTotal: 0 }),
  [lines]);

  function updateLine(index: number, action: PrognoseLineAction, customAmount?: number) {
    setLines((prev) => {
      const updated = [...prev];
      const line = { ...updated[index] };
      line.action = action;
      if (action === 'copy') line.forecastTotal = line.lastKnownTotal;
      else if (action === 'stop') line.forecastTotal = 0;
      else if (action === 'custom' && customAmount !== undefined) line.forecastTotal = customAmount;
      updated[index] = line;
      return updated;
    });
  }

  async function handleSave() {
    setSaving(true);
    const prognoseEntries = lines
      .filter((l) => l.forecastTotal > 0)
      .map((l) => ({
        revenue_client_id: l.clientId,
        division_id: l.divisionId,
        service_name: l.serviceName,
        amount: l.forecastTotal,
      }));
    const result = await savePrognose(forecastYear, prognoseEntries);
    setSaving(false);
    if ('error' in result && result.error) {
      toast.error(typeof result.error === 'string' ? result.error : 'Opslaan mislukt');
      return;
    }
    toast.success('Prognose opgeslagen');
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard title={`Prognose ${forecastYear}`} value={formatEUR(totalForecast)} icon={TrendingUp} />
        <StatCard title={`Realisatie ${lastKnownYear}`} value={formatEUR(totalLastYear)} icon={DollarSign} />
        <StatCard title="Consultancy" value={formatEUR(consultancyTotal)} icon={Users} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Prognose {forecastYear}</CardTitle>
          <Button onClick={handleSave} disabled={saving} size="sm">
            <Save />
            {saving ? 'Opslaan...' : 'Opslaan'}
          </Button>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Client</th>
                <th className="text-left p-2">Division</th>
                <th className="text-left p-2">Service</th>
                <th className="text-right p-2">{lastKnownYear}</th>
                <th className="text-right p-2">{forecastYear}</th>
                <th className="text-center p-2">Actie</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => (
                <tr key={`${line.clientId}-${line.divisionId}-${line.serviceName}`} className={`border-b ${line.action === 'stop' ? 'opacity-50 line-through' : ''}`}>
                  <td className="p-2">{line.clientName}</td>
                  <td className="p-2">{line.divisionName}</td>
                  <td className="p-2">{line.serviceName}</td>
                  <td className="text-right p-2 tabular-nums">{formatEUR(line.lastKnownTotal)}</td>
                  <td className="text-right p-2">
                    {line.action === 'custom' ? (
                      <Input
                        type="number"
                        value={line.forecastTotal}
                        onChange={(e) => updateLine(i, 'custom', Number(e.target.value))}
                        className="w-28 text-right inline-block"
                      />
                    ) : (
                      <span className="tabular-nums">{formatEUR(line.forecastTotal)}</span>
                    )}
                  </td>
                  <td className="text-center p-2">
                    <div className="flex gap-1 justify-center">
                      <Button variant={line.action === 'copy' ? 'default' : 'ghost'} size="sm" className="text-xs h-7 px-2" onClick={() => updateLine(i, 'copy')}>Zelfde</Button>
                      <Button variant={line.action === 'custom' ? 'default' : 'ghost'} size="sm" className="text-xs h-7 px-2" onClick={() => updateLine(i, 'custom', line.forecastTotal)}>Aanpassen</Button>
                      <Button variant={line.action === 'stop' ? 'destructive' : 'ghost'} size="sm" className="text-xs h-7 px-2" onClick={() => updateLine(i, 'stop')}>Gestopt</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
