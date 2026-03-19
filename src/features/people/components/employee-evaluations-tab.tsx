'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Evaluation } from '../types';

type Props = { evaluations: Evaluation[] };

export function EmployeeEvaluationsTab({ evaluations }: Props) {
  if (!evaluations || evaluations.length === 0) {
    return <p className="mt-4 text-sm text-muted-foreground">Geen evaluaties beschikbaar.</p>;
  }

  const sorted = [...evaluations].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));

  return (
    <div className="mt-4 space-y-3">
      {sorted.map((ev) => (
        <Card key={ev.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{ev.type}</Badge>
              {ev.score && <Badge variant="secondary">{ev.score}</Badge>}
              <span className="ml-auto text-xs text-muted-foreground">
                {ev.date ? new Date(ev.date).toLocaleDateString('nl-BE') : ''}
              </span>
            </div>
          </CardHeader>
          {ev.notes && (
            <CardContent>
              <p className="text-sm whitespace-pre-wrap text-muted-foreground">{ev.notes}</p>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
