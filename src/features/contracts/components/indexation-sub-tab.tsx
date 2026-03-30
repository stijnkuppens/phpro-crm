'use client';

import { Calendar, CheckCircle, Clock, FileText } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { approveIndexation } from '@/features/indexation/actions/approve-indexation';
import type { IndexationHistoryFull } from '@/features/indexation/queries/get-indexation-history';
import type { IndexationDraftFull } from '@/features/indexation/types';

type Props = {
  accountId: string;
  indexationDraft: IndexationDraftFull | null;
  indexationHistory: IndexationHistoryFull[];
  onSimulate: () => void;
  onApproved: () => void;
};

const MONTHS = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

function fmtDate(d: string): string {
  const date = new Date(d);
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function IndexationSubTab({ accountId, indexationDraft, indexationHistory, onSimulate, onApproved }: Props) {
  const [approving, setApproving] = useState(false);

  async function handleApprove() {
    if (!indexationDraft) return;
    setApproving(true);
    const result = await approveIndexation(accountId, indexationDraft.id);
    setApproving(false);
    if ('error' in result && result.error) {
      toast.error(typeof result.error === 'string' ? result.error : 'Goedkeuring mislukt');
      return;
    }
    toast.success('Indexatie goedgekeurd en toegepast');
    onApproved();
  }

  return (
    <div className="space-y-6 mt-4">
      {/* Draft section */}
      {indexationDraft && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Clock className="h-4 w-4 text-amber-600" />
                Actieve draft
              </CardTitle>
              <Badge className="bg-amber-100 text-amber-700 border-0">Draft</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-sm mb-4">
              <div>
                <span className="text-muted-foreground">Doeljaar</span>
                <div className="font-medium">{indexationDraft.target_year}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Basisjaar</span>
                <div className="font-medium">{indexationDraft.base_year}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Percentage</span>
                <div className="font-medium text-primary-action">+{Number(indexationDraft.percentage)}%</div>
              </div>
              <div>
                <span className="text-muted-foreground">Rollen</span>
                <div className="font-medium">{indexationDraft.rates?.length ?? 0}</div>
              </div>
            </div>
            {indexationDraft.info && <p className="text-sm text-muted-foreground mb-4">{indexationDraft.info}</p>}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={onSimulate}>
                Hervatten
              </Button>
              <ConfirmDialog
                title="Indexatie goedkeuren?"
                description={`Dit past de tarieven toe voor ${indexationDraft.target_year} met +${Number(indexationDraft.percentage)}%. Dit kan niet ongedaan worden gemaakt.`}
                onConfirm={handleApprove}
                trigger={
                  <Button size="sm" disabled={approving}>
                    {approving ? 'Goedkeuren...' : 'Goedkeuren & toepassen'}
                  </Button>
                }
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* History */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          Indexatie geschiedenis
        </h3>
        {indexationHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Geen indexatie geschiedenis.</p>
        ) : (
          <div className="space-y-2">
            {indexationHistory.map((entry) => (
              <Card key={entry.id}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <CheckCircle className="h-4 w-4 text-primary-action" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">Doeljaar {entry.target_year}</span>
                          <Badge className="bg-primary/15 text-primary-action border-0 text-xs">
                            +{Number(entry.percentage)}%
                          </Badge>
                          <span className="text-muted-foreground">{entry.rates?.length ?? 0} rollen</span>
                        </div>
                        {entry.info && <p className="text-xs text-muted-foreground mt-0.5">{entry.info}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {fmtDate(entry.date)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
