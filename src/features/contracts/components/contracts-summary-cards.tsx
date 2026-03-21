'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Calendar, Shield, TrendingUp } from 'lucide-react';
import type { Contract } from '../types';
import type { IndexationConfig } from '@/features/indexation/types';

type Props = {
  contract: Contract | null;
  indexationConfig: IndexationConfig | null;
};

const MONTHS = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—';
  const date = new Date(d);
  return `${String(date.getDate()).padStart(2, '0')} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function ContractsSummaryCards({ contract, indexationConfig }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Indexering */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            Indexering
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">Type</span>
            <div>{indexationConfig?.indexation_type || <span className="text-muted-foreground italic">Niet ingesteld</span>}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Geldig vanaf</span>
            <div>
              {indexationConfig?.start_month && indexationConfig?.start_year
                ? `${MONTHS[(indexationConfig.start_month - 1) % 12]} ${indexationConfig.start_year}`
                : <span className="text-muted-foreground italic">Niet ingesteld</span>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Raamcontract */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Shield className="h-4 w-4 text-muted-foreground" />
              Raamcontract
            </CardTitle>
            <Badge className={contract?.has_framework_contract ? 'bg-primary/15 text-primary-action border-0' : 'bg-muted text-muted-foreground border-0'}>
              {contract?.has_framework_contract ? 'Ja' : 'Nee'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {contract?.has_framework_contract ? (
            <>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {fmtDate(contract.framework_start)} → {contract.framework_indefinite ? 'Onbepaald' : fmtDate(contract.framework_end)}
              </div>
              {contract.framework_pdf_url && (
                <a
                  href={contract.framework_pdf_url}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs hover:bg-muted transition-colors"
                >
                  <FileText className="h-3.5 w-3.5" />
                  {contract.framework_pdf_url.split('/').pop() ?? 'PDF'}
                </a>
              )}
            </>
          ) : (
            <p className="text-muted-foreground italic">Geen raamcontract</p>
          )}
        </CardContent>
      </Card>

      {/* Service Contract (SLA) */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Shield className="h-4 w-4 text-muted-foreground" />
              Service Contract (SLA)
            </CardTitle>
            <Badge className={contract?.has_service_contract ? 'bg-primary/15 text-primary-action border-0' : 'bg-muted text-muted-foreground border-0'}>
              {contract?.has_service_contract ? 'Ja' : 'Nee'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {contract?.has_service_contract ? (
            <>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {fmtDate(contract.service_start)} → {contract.service_indefinite ? 'Onbepaald' : fmtDate(contract.service_end)}
              </div>
              {contract.service_pdf_url && (
                <a
                  href={contract.service_pdf_url}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs hover:bg-muted transition-colors"
                >
                  <FileText className="h-3.5 w-3.5" />
                  {contract.service_pdf_url.split('/').pop() ?? 'PDF'}
                </a>
              )}
            </>
          ) : (
            <p className="text-muted-foreground italic">Geen dienstencontract</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
