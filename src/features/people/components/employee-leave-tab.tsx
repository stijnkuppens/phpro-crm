'use client';

import type { LeaveBalance } from '../types';

type Props = { balances: LeaveBalance[] };

export function EmployeeLeaveTab({ balances }: Props) {
  if (!balances || balances.length === 0) {
    return <p className="mt-4 text-sm text-muted-foreground">Geen verlofgegevens beschikbaar.</p>;
  }

  const sorted = [...balances].sort((a, b) => (b.year ?? 0) - (a.year ?? 0));

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2 pr-4 font-medium">Jaar</th>
            <th className="pb-2 pr-4 font-medium">Tegoed</th>
            <th className="pb-2 pr-4 font-medium">Opgenomen</th>
            <th className="pb-2 font-medium">Resterend</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {sorted.map((row) => {
            const remaining = (row.allowance ?? 0) - (row.taken ?? 0);
            return (
              <tr key={row.id}>
                <td className="py-2 pr-4">{row.year}</td>
                <td className="py-2 pr-4">{row.allowance}</td>
                <td className="py-2 pr-4">{row.taken}</td>
                <td className={`py-2 font-medium ${remaining <= 2 ? 'text-red-600' : ''}`}>
                  {remaining}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
