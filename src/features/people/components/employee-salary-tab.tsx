'use client';

import type { SalaryHistory } from '../types';

type Props = { history: SalaryHistory[] };

const fmt = (n: number) =>
  new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

export function EmployeeSalaryTab({ history }: Props) {
  if (!history || history.length === 0) {
    return <p className="mt-4 text-sm text-muted-foreground">Geen loonhistoriek beschikbaar.</p>;
  }

  const sorted = [...history].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2 pr-4 font-medium">Datum</th>
            <th className="pb-2 pr-4 font-medium">Brutoloon</th>
            <th className="pb-2 font-medium">Reden</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {sorted.map((row) => (
            <tr key={row.id}>
              <td className="py-2 pr-4">
                {row.date ? new Date(row.date).toLocaleDateString('nl-BE') : '—'}
              </td>
              <td className="py-2 pr-4">{fmt(Number(row.gross_salary ?? 0))}</td>
              <td className="py-2 text-muted-foreground">{row.reason ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
