'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link2 } from 'lucide-react';
import { BenchDetailModal } from './bench-detail-modal';
import { LinkConsultantWizard } from '@/features/consultants/components/link-consultant-wizard';
import type { BenchConsultantWithLanguages } from '../types';

type Account = { id: string; name: string; domain: string | null; type: string | null; city: string | null };

type Pipeline = {
  id: string;
  name: string;
  type: string;
  stages: { id: string; name: string; sort_order: number; is_closed: boolean }[];
};

type Props = {
  consultants: BenchConsultantWithLanguages[];
  pipelines: Pipeline[];
  accounts: Account[];
  roles: { value: string; label: string }[];
};

const priorityColors: Record<string, string> = {
  High: 'bg-red-100 text-red-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  Low: 'bg-gray-100 text-gray-800',
};

export function BenchGrid({ consultants, pipelines, accounts, roles }: Props) {
  const [selected, setSelected] = useState<BenchConsultantWithLanguages | null>(null);
  const [koppelTarget, setKoppelTarget] = useState<BenchConsultantWithLanguages | null>(null);

  if (consultants.length === 0) {
    return <p className="text-center text-muted-foreground py-8">Geen bench consultants.</p>;
  }

  return (
    <>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {consultants.map((c) => (
        <Card key={c.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelected(c)}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">
                {c.first_name} {c.last_name}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    setKoppelTarget(c);
                  }}
                >
                  <Link2 className="h-3 w-3 mr-1" />
                  Koppel
                </Button>
                <Badge className={priorityColors[c.priority] ?? ''}>{c.priority}</Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{c.city}</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {c.roles && c.roles.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {c.roles.map((r) => (
                  <Badge key={r} variant="secondary" className="text-[10px]">{r}</Badge>
                ))}
              </div>
            )}
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {c.min_hourly_rate && c.max_hourly_rate
                  ? `€${c.min_hourly_rate} - €${c.max_hourly_rate}/u`
                  : ''}
              </span>
              <span>
                {c.available_date
                  ? `Beschikbaar: ${new Date(c.available_date).toLocaleDateString('nl-BE')}`
                  : ''}
              </span>
            </div>
            {c.languages && c.languages.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {c.languages.map((l) => (
                  <span key={l.id} className="text-[10px] text-muted-foreground">
                    {l.language} ({l.level})
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>

    {selected && (
      <BenchDetailModal
        consultant={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        pipelines={pipelines}
        accounts={accounts}
        roles={roles}
        benchConsultants={consultants}
      />
    )}

    {koppelTarget && (
      <LinkConsultantWizard
        open={!!koppelTarget}
        onClose={() => setKoppelTarget(null)}
        accounts={accounts}
        benchConsultants={consultants}
        roles={roles}
        preselectedBenchConsultantId={koppelTarget.id}
      />
    )}
    </>
  );
}
