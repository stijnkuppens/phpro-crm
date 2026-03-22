'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { contractStatusColors, contractStatusDescriptions, type ConsultantWithDetails } from '../types';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { getContractStatus, getCurrentRate } from '../utils';
import { ConsultantDetailModal } from './consultant-detail-modal';
import { LinkConsultantWizard } from './link-consultant-wizard';
import { formatEUR } from '@/lib/format';

type Props = {
  accountId: string;
  accountName: string;
  consultants: ConsultantWithDetails[];
  roles: { value: string; label: string }[];
};

export function AccountConsultantsTab({ accountId, accountName, consultants, roles }: Props) {
  const [selected, setSelected] = useState<ConsultantWithDetails | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Consultants</h3>
        <Button size="sm" onClick={() => setWizardOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Consultant koppelen
        </Button>
      </div>

      {consultants.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">Geen consultants voor dit account.</p>
          <Button variant="outline" onClick={() => setWizardOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Consultant koppelen
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {consultants.map((c) => {
            const status = getContractStatus(c);
            const rate = getCurrentRate(c);
            return (
              <Card
                key={c.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelected(c)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{c.first_name} {c.last_name}</div>
                    <div className="text-xs text-muted-foreground">{c.role} - {c.city}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{formatEUR(rate)}/u</div>
                    <div className="text-xs text-muted-foreground">{formatEUR(rate * 8 * 21)}/maand</div>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger render={<Badge className={`cursor-help ${contractStatusColors[status]}`}>{status}</Badge>} />
                      <TooltipContent>{contractStatusDescriptions[status]}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <div className="text-xs text-muted-foreground">
                    {c.start_date ? new Date(c.start_date).toLocaleDateString('nl-BE') : ''} -
                    {c.is_indefinite ? ' onbepaald' : c.end_date ? ` ${new Date(c.end_date).toLocaleDateString('nl-BE')}` : ''}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selected && (
        <ConsultantDetailModal
          consultant={selected}
          open={!!selected}
          onClose={() => setSelected(null)}
        />
      )}

      <LinkConsultantWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        accounts={[{ id: accountId, name: accountName, domain: null, type: null, city: null }]}
        roles={roles}
        preselectedAccountId={accountId}
      />
    </>
  );
}
