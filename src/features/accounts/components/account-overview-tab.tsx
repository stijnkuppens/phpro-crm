'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AccountWithRelations } from '../types';
import type { Contract } from '@/features/contracts/types';
import type { ContactWithDetails } from '@/features/contacts/types';
import { FileText, Shield, Users } from 'lucide-react';
import { Avatar } from '@/components/admin/avatar';
import type { ReferenceOption } from '../types';
import { InfoRow } from '@/components/admin/info-row';

type Props = {
  account: AccountWithRelations;
  contract: Contract | null;
  contacts: ContactWithDetails[];
  internalPeople?: ReferenceOption[];
};

export function AccountOverviewTab({ account, contract, contacts, internalPeople = [] }: Props) {
  const personLookup = new Map(internalPeople.map((p) => [p.name, p]));
  const steercoContacts = contacts.filter((c) => c.is_steerco || c.is_pinned);

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
          {account.about && (
            <div className="pt-2 border-t">
              <span className="text-sm font-semibold">Over</span>
              <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap">{account.about}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team & Health */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">PHPro Intern</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <PersonRow label="Mng. Partner" value={account.managing_partner} person={personLookup.get(account.managing_partner ?? '')} />
          <PersonRow label="Acc. Director" value={account.account_director} person={personLookup.get(account.account_director ?? '')} />
          <PersonRow label="Project Manager" value={account.project_manager_id} person={personLookup.get(account.project_manager_id ?? '')} />
          <InfoRow label="Owner" value={account.owner?.full_name} />
          <InfoRow label="Team" value={account.team} />
          <InfoRow label="Contract" value={account.phpro_contract} />
          {account.samenwerkingsvormen.length > 0 && (
            <div className="flex">
              <span className="text-muted-foreground w-32 shrink-0">Samenwerking</span>
              <div className="flex flex-wrap gap-1">
                {account.samenwerkingsvormen.map((s) => (
                  <Badge key={s.id} variant="secondary" className="text-xs">{s.collaboration_type.name}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contracts Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <FileText className="h-4 w-4" />
            Contracten
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Raamcontract</span>
            <Badge variant={contract?.has_framework_contract ? 'default' : 'secondary'} className="text-xs">
              {contract?.has_framework_contract ? 'Actief' : 'Nee'}
            </Badge>
          </div>
          {contract?.has_framework_contract && contract.framework_start && (
            <p className="text-xs text-muted-foreground pl-6">
              Geldig t/m {contract.framework_end ? new Date(contract.framework_end).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Onbepaald'}
            </p>
          )}
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">SLA</span>
            <Badge variant={contract?.has_service_contract ? 'default' : 'secondary'} className="text-xs">
              {contract?.has_service_contract ? 'Actief' : 'Nee'}
            </Badge>
          </div>
          {contract?.has_service_contract && contract.service_start && (
            <p className="text-xs text-muted-foreground pl-6">
              {contract.service_indefinite ? 'Onbepaalde duur' : contract.service_end ? `Geldig t/m ${new Date(contract.service_end).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
            </p>
          )}
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
              <Badge key={t.id} variant="secondary">{t.technology.name}</Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Services */}
      {account.manual_services.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">PHPro Services</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {account.manual_services.map((s) => (
              <Badge key={s.id} variant="outline">{s.service_name}</Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Competence Centers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Andere Competence Centers</CardTitle>
        </CardHeader>
        <CardContent>
          {account.competence_centers.length > 0 ? (
            <div className="space-y-2 text-sm">
              {account.competence_centers.map((cc) => (
                <div key={cc.id} className="flex items-center gap-3">
                  <span className="font-medium">{cc.cc.name}</span>
                  {cc.contact_person && <span className="text-muted-foreground">{cc.contact_person}</span>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">—</p>
          )}
        </CardContent>
      </Card>

      {/* Hosting */}
      {account.hosting.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              Hosting
              <Badge variant="secondary" className="text-xs">{account.hosting.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {account.hosting.map((h) => (
                <div key={h.id} className="flex items-center gap-4 text-sm">
                  <span className="font-medium">{h.provider.name}</span>
                  <span className="text-muted-foreground">{h.environment?.name}</span>
                  {h.url && <a href={h.url} target="_blank" rel="noopener" className="text-primary-action hover:underline text-xs">{h.url}</a>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Extern Contacts Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Users className="h-4 w-4" />
            Extern
            {steercoContacts.length > 0 && <Badge variant="secondary" className="text-xs">{steercoContacts.length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {steercoContacts.length > 0 ? (
            <div className="space-y-3">
              {steercoContacts.map((c) => (
                <div key={c.id} className="flex items-center gap-3">
                  <Avatar fallback={`${(c.first_name?.[0] ?? '').toUpperCase()}${(c.last_name?.[0] ?? '').toUpperCase()}`} size="sm" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{c.first_name} {c.last_name}</span>
                      {c.is_steerco && <Badge variant="outline" className="text-[10px]">Steerco</Badge>}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {c.title && <span>{c.title}</span>}
                      {c.title && c.role && <span>·</span>}
                      {c.role && <span>{c.role}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Geen contacten</p>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

function PersonRow({ label, value, person }: { label: string; value?: string | null; person?: ReferenceOption }) {
  if (!value) return null;
  const initials = value.split(/\s+/).map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2);
  return (
    <div className="flex">
      <span className="text-muted-foreground w-32 shrink-0">{label}</span>
      <span className="flex items-center gap-2">
        <Avatar path={person?.avatar_url} fallback={initials} size="xs" />
        {value}
      </span>
    </div>
  );
}
