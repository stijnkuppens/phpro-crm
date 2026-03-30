'use client';

import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type Props = {
  hrRoles: string[];
  hrGrid: Record<string, Record<number, string>>;
  hrVisibleYears: number[];
  currentYear: number;
  updateHrRate: (role: string, year: number, value: string) => void;
  addHrRole: () => void;
  removeHrRole: (role: string) => void;
  renameHrRole: (oldName: string, newName: string) => void;
  setHrWindowStart: (fn: (y: number) => number) => void;
};

export function ContractHourlyRatesSection({
  hrRoles,
  hrGrid,
  hrVisibleYears,
  currentYear,
  updateHrRate,
  addHrRole,
  removeHrRole,
  renameHrRole,
  setHrWindowStart,
}: Props) {
  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Uurtarieven
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon-sm" onClick={() => setHrWindowStart((y) => y + 1)}>
              <ChevronLeft />
            </Button>
            <span className="text-xs text-muted-foreground tabular-nums">
              {hrVisibleYears[0]}&ndash;{hrVisibleYears[2]}
            </span>
            <Button variant="ghost" size="icon-sm" onClick={() => setHrWindowStart((y) => y - 1)}>
              <ChevronRight />
            </Button>
            <Button variant="outline" size="sm" onClick={addHrRole}>
              <Plus /> Rol
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-2.5 font-medium w-56">Rol</th>
                {hrVisibleYears.map((year) => (
                  <th
                    key={year}
                    className={`text-right p-2.5 font-medium w-32 ${year === currentYear ? 'bg-primary/5' : ''}`}
                  >
                    {year} (&euro;/u)
                  </th>
                ))}
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {hrRoles.map((role) => (
                <tr key={role} className="border-b last:border-0">
                  <td className="p-1.5">
                    <Input
                      value={role}
                      onChange={(e) => renameHrRole(role, e.target.value)}
                      className="h-9 text-sm"
                    />
                  </td>
                  {hrVisibleYears.map((year) => (
                    <td
                      key={year}
                      className={`p-1.5 ${year === currentYear ? 'bg-primary/5' : ''}`}
                    >
                      <Input
                        type="number"
                        value={hrGrid[role]?.[year] ?? ''}
                        onChange={(e) => updateHrRate(role, year, e.target.value)}
                        placeholder="0"
                        className="h-9 text-right text-sm"
                      />
                    </td>
                  ))}
                  <td className="p-1.5 text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeHrRole(role)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
              {hrRoles.length === 0 && (
                <tr>
                  <td
                    colSpan={hrVisibleYears.length + 2}
                    className="p-6 text-center text-muted-foreground"
                  >
                    Geen rollen. Klik &quot;Rol toevoegen&quot; om te beginnen.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
