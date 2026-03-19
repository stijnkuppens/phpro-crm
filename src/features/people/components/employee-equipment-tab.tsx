'use client';

import { Badge } from '@/components/ui/badge';
import type { Equipment } from '../types';

type Props = { equipment: Equipment[] };

export function EmployeeEquipmentTab({ equipment }: Props) {
  if (!equipment || equipment.length === 0) {
    return <p className="mt-4 text-sm text-muted-foreground">Geen materiaal toegewezen.</p>;
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2 pr-4 font-medium">Type</th>
            <th className="pb-2 pr-4 font-medium">Naam</th>
            <th className="pb-2 pr-4 font-medium">Serienummer</th>
            <th className="pb-2 pr-4 font-medium">Uitgegeven</th>
            <th className="pb-2 font-medium">Teruggegeven</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {equipment.map((item) => (
            <tr key={item.id}>
              <td className="py-2 pr-4">
                <Badge variant="outline">{item.type}</Badge>
              </td>
              <td className="py-2 pr-4">{item.name}</td>
              <td className="py-2 pr-4 text-muted-foreground">{item.serial_number ?? '—'}</td>
              <td className="py-2 pr-4">
                {item.date_issued ? new Date(item.date_issued).toLocaleDateString('nl-BE') : '—'}
              </td>
              <td className="py-2">
                {item.date_returned ? new Date(item.date_returned).toLocaleDateString('nl-BE') : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
