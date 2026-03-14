'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Contract, HourlyRate, SlaRateWithTools } from '../types';

type Props = {
  contract: Contract | null;
  hourlyRates: HourlyRate[];
  slaRates: SlaRateWithTools[];
};

const fmt = (n: number) =>
  new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' }).format(n);

export function ContractsTab({ contract, hourlyRates, slaRates }: Props) {
  // Group hourly rates by year
  const ratesByYear = hourlyRates.reduce<Record<number, HourlyRate[]>>((acc, rate) => {
    const year = rate.year;
    if (!acc[year]) acc[year] = [];
    acc[year].push(rate);
    return acc;
  }, {});

  const years = Object.keys(ratesByYear).map(Number).sort((a, b) => b - a);

  return (
    <div className="space-y-6">
      {/* Framework Contract */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Raamcontract</CardTitle>
        </CardHeader>
        <CardContent>
          {contract?.has_framework_contract ? (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Start:</span>{' '}
                {contract.framework_start ? new Date(contract.framework_start).toLocaleDateString('nl-BE') : '-'}
              </div>
              <div>
                <span className="text-muted-foreground">Einde:</span>{' '}
                {contract.framework_indefinite ? 'Onbepaald' : contract.framework_end ? new Date(contract.framework_end).toLocaleDateString('nl-BE') : '-'}
              </div>
              {contract.framework_pdf_url && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Document:</span> {contract.framework_pdf_url}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Geen raamcontract.</p>
          )}
        </CardContent>
      </Card>

      {/* Service Contract */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dienstencontract (SLA)</CardTitle>
        </CardHeader>
        <CardContent>
          {contract?.has_service_contract ? (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Start:</span>{' '}
                {contract.service_start ? new Date(contract.service_start).toLocaleDateString('nl-BE') : '-'}
              </div>
              <div>
                <span className="text-muted-foreground">Einde:</span>{' '}
                {contract.service_indefinite ? 'Onbepaald' : contract.service_end ? new Date(contract.service_end).toLocaleDateString('nl-BE') : '-'}
              </div>
              {contract.service_pdf_url && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Document:</span> {contract.service_pdf_url}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Geen dienstencontract.</p>
          )}
        </CardContent>
      </Card>

      {/* Purchase Orders */}
      {contract?.purchase_orders_url && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bestelbonnen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{contract.purchase_orders_url}</p>
          </CardContent>
        </Card>
      )}

      {/* Hourly Rates by Year */}
      {years.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Uurtarieven</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {years.map((year) => (
              <div key={year}>
                <h4 className="text-sm font-medium mb-2">{year}</h4>
                <div className="border rounded-md">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-2">Rol</th>
                        <th className="text-right p-2">Tarief</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ratesByYear[year].sort((a, b) => a.role.localeCompare(b.role)).map((r) => (
                        <tr key={r.id} className="border-b last:border-0">
                          <td className="p-2">{r.role}</td>
                          <td className="p-2 text-right">{fmt(Number(r.rate))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* SLA Rates by Year */}
      {slaRates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">SLA Tarieven</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {slaRates
              .sort((a, b) => b.year - a.year)
              .map((sla) => (
                <div key={sla.id}>
                  <h4 className="text-sm font-medium mb-2">{sla.year}</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vast maandbedrag</span>
                      <span>{fmt(Number(sla.fixed_monthly_rate))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Support uurtarief</span>
                      <span>{fmt(Number(sla.support_hourly_rate))}</span>
                    </div>
                    {sla.tools && sla.tools.length > 0 && (
                      <div className="mt-2">
                        <span className="text-muted-foreground">Tools:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {sla.tools.map((t) => (
                            <Badge key={t.id} variant="outline">
                              {t.tool_name} ({fmt(Number(t.monthly_price))}/m)
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {years.length === 0 && slaRates.length === 0 && (
        <p className="text-center text-muted-foreground py-4">Geen tarieven geconfigureerd.</p>
      )}
    </div>
  );
}
