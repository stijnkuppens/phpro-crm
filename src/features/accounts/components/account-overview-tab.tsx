'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AccountWithRelations } from '../types';

type Props = {
  account: AccountWithRelations;
};

export function AccountOverviewTab({ account }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Bedrijfsinformatie</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <InfoRow label="Type" value={account.type} />
          <InfoRow label="Status" value={account.status} />
          <InfoRow label="Sector" value={account.industry} />
          <InfoRow label="Grootte" value={account.size} />
          <InfoRow label="Omzet" value={account.revenue ? `€${Number(account.revenue).toLocaleString('nl-BE')}` : undefined} />
          <InfoRow label="Telefoon" value={account.phone} />
          <InfoRow label="Website" value={account.website} />
          <InfoRow label="Adres" value={account.address} />
          <InfoRow label="Land" value={account.country} />
          <InfoRow label="BTW" value={account.vat_number} />
          <InfoRow label="PHPro Contract" value={account.phpro_contract} />
        </CardContent>
      </Card>

      {/* Team & Health */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Team & Health</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <InfoRow label="Managing Partner" value={account.managing_partner} />
          <InfoRow label="Account Director" value={account.account_director} />
          <InfoRow label="Team" value={account.team} />
          <InfoRow label="Owner" value={account.owner?.full_name} />
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-32">Health</span>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${account.health ?? 0}%`,
                  backgroundColor: (account.health ?? 0) >= 70 ? '#22c55e' : (account.health ?? 0) >= 40 ? '#f59e0b' : '#ef4444',
                }}
              />
            </div>
            <span className="text-xs font-medium">{account.health ?? 0}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Tech Stack */}
      {account.tech_stacks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Tech Stack</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {account.tech_stacks.map((t) => (
              <Badge key={t.id} variant="secondary">{t.technology}</Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Services */}
      {account.manual_services.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Services</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {account.manual_services.map((s) => (
              <Badge key={s.id} variant="outline">{s.service_name}</Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Samenwerkingsvormen */}
      {account.samenwerkingsvormen.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Samenwerkingsvormen</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {account.samenwerkingsvormen.map((s) => (
              <Badge key={s.id} variant="secondary">{s.type}</Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Hosting */}
      {account.hosting.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Hosting</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {account.hosting.map((h) => (
                <div key={h.id} className="flex items-center gap-4 text-sm">
                  <span className="font-medium">{h.provider}</span>
                  <span className="text-muted-foreground">{h.environment}</span>
                  {h.url && <a href={h.url} target="_blank" rel="noopener" className="text-blue-600 underline text-xs">{h.url}</a>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* About */}
      {account.about && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Over</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{account.about}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex">
      <span className="text-muted-foreground w-32 shrink-0">{label}</span>
      <span>{value}</span>
    </div>
  );
}
