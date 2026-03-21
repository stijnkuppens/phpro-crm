'use client';

import { useState } from 'react';
import { Modal } from '@/components/admin/modal';
import { Avatar } from '@/components/admin/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { getContractStatus, getCurrentRate, contractStatusColors, type ConsultantWithDetails } from '../types';
import { StopConsultantModal } from './stop-consultant-modal';
import { ExtendConsultantModal } from './extend-consultant-modal';
import { RateChangeModal } from './rate-change-modal';
import { ContractAttributionModal } from './contract-attribution-modal';

type Props = {
  consultant: ConsultantWithDetails;
  open: boolean;
  onClose: () => void;
};

const fmt = (n: number) =>
  new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' }).format(n);

const priorityColors: Record<string, string> = {
  High: 'bg-red-100 text-red-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  Low: 'bg-green-100 text-green-800',
};

const statusLabels: Record<string, string> = {
  bench: 'Bench',
  actief: 'Actief',
  stopgezet: 'Stopgezet',
};

const statusColors: Record<string, string> = {
  bench: 'bg-blue-100 text-blue-800',
  actief: 'bg-green-100 text-green-800',
  stopgezet: 'bg-gray-300 text-gray-600',
};

function BenchDetail({ consultant }: { consultant: ConsultantWithDetails }) {
  return (
    <div className="space-y-6">
      {/* Priority & availability */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Prioriteit:</span>{' '}
          {consultant.priority ? (
            <Badge className={priorityColors[consultant.priority]}>{consultant.priority}</Badge>
          ) : '-'}
        </div>
        <div><span className="text-muted-foreground">Stad:</span> {consultant.city ?? '-'}</div>
        <div>
          <span className="text-muted-foreground">Beschikbaar vanaf:</span>{' '}
          {consultant.available_date ? new Date(consultant.available_date).toLocaleDateString('nl-BE') : '-'}
        </div>
        <div>
          <span className="text-muted-foreground">Tarief:</span>{' '}
          {consultant.min_hourly_rate || consultant.max_hourly_rate
            ? `${consultant.min_hourly_rate ? fmt(consultant.min_hourly_rate) : '?'} - ${consultant.max_hourly_rate ? fmt(consultant.max_hourly_rate) : '?'}/u`
            : '-'}
        </div>
      </div>

      {/* Roles */}
      {consultant.roles && consultant.roles.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Rollen</h4>
          <div className="flex flex-wrap gap-1">
            {consultant.roles.map((role) => (
              <Badge key={role} className="bg-primary/15 text-primary-action border-0">{role}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Technologies */}
      {consultant.technologies && consultant.technologies.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Technologieen</h4>
          <div className="flex flex-wrap gap-1">
            {consultant.technologies.map((tech) => (
              <Badge key={tech} className="bg-muted text-muted-foreground border-0">{tech}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Languages */}
      {consultant.languages && consultant.languages.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Talen</h4>
          <div className="flex flex-wrap gap-1">
            {consultant.languages.map((lang) => (
              <Badge key={lang.id} className="bg-muted text-muted-foreground border-0">
                {lang.language} ({lang.level})
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* CV */}
      {consultant.cv_pdf_url && (
        <div>
          <h4 className="text-sm font-medium mb-1">CV</h4>
          <a
            href={consultant.cv_pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary-action hover:underline inline-flex items-center gap-1"
          >
            CV bekijken
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}

      {/* Description */}
      {consultant.description && (
        <div>
          <h4 className="text-sm font-medium mb-1">Beschrijving</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{consultant.description}</p>
        </div>
      )}
    </div>
  );
}

function ActiveDetail({ consultant }: { consultant: ConsultantWithDetails }) {
  const status = getContractStatus(consultant);
  const rate = getCurrentRate(consultant);

  return (
    <div className="space-y-6">
      {/* Header info */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div><span className="text-muted-foreground">Rol:</span> {consultant.role ?? '-'}</div>
        <div><span className="text-muted-foreground">Stad:</span> {consultant.city ?? '-'}</div>
        <div><span className="text-muted-foreground">Account:</span> {consultant.account?.name ?? consultant.client_name ?? '-'}</div>
        <div>
          <span className="text-muted-foreground">Contract:</span>{' '}
          <Badge className={contractStatusColors[status]}>{status}</Badge>
        </div>
        <div><span className="text-muted-foreground">Huidig tarief:</span> {fmt(rate)}/u</div>
        <div>
          <span className="text-muted-foreground">Periode:</span>{' '}
          {consultant.start_date ? new Date(consultant.start_date).toLocaleDateString('nl-BE') : '-'} -{' '}
          {consultant.is_indefinite ? 'onbepaald' : consultant.end_date ? new Date(consultant.end_date).toLocaleDateString('nl-BE') : '-'}
        </div>
        <div><span className="text-muted-foreground">Opzegtermijn:</span> {consultant.notice_period_days ?? 30} dagen</div>
      </div>

      {/* Contract Attribution */}
      {consultant.contract_attribution && (
        <div>
          <h4 className="text-sm font-medium mb-2">Contract attributie</h4>
          <div className="border rounded-md p-3 text-sm space-y-1">
            <div>
              <span className="text-muted-foreground">Type:</span>{' '}
              <Badge className={consultant.contract_attribution.type === 'rechtstreeks' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                {consultant.contract_attribution.type === 'rechtstreeks' ? 'Rechtstreeks' : 'Cronos'}
              </Badge>
            </div>
            {consultant.contract_attribution.type === 'cronos' && (
              <>
                {consultant.contract_attribution.cc_name && (
                  <div><span className="text-muted-foreground">CC Naam:</span> {consultant.contract_attribution.cc_name}</div>
                )}
                {consultant.contract_attribution.cc_contact_person && (
                  <div><span className="text-muted-foreground">CC Contactpersoon:</span> {consultant.contract_attribution.cc_contact_person}</div>
                )}
                {consultant.contract_attribution.cc_email && (
                  <div><span className="text-muted-foreground">CC E-mail:</span> {consultant.contract_attribution.cc_email}</div>
                )}
                {consultant.contract_attribution.cc_phone && (
                  <div><span className="text-muted-foreground">CC Telefoon:</span> {consultant.contract_attribution.cc_phone}</div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* SOW URL */}
      {consultant.sow_url && (
        <div>
          <h4 className="text-sm font-medium mb-1">SOW</h4>
          <a
            href={consultant.sow_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary-action hover:underline inline-flex items-center gap-1"
          >
            {consultant.sow_url}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}

      {/* Notes */}
      {consultant.notes && (
        <div>
          <h4 className="text-sm font-medium mb-1">Notities</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{consultant.notes}</p>
        </div>
      )}

      {/* Rate history */}
      {consultant.rate_history && consultant.rate_history.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Tariefgeschiedenis</h4>
          <div className="border rounded-md">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-2">Datum</th>
                  <th className="text-right p-2">Tarief</th>
                  <th className="text-left p-2">Reden</th>
                </tr>
              </thead>
              <tbody>
                {[...consultant.rate_history]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((rh) => (
                    <tr key={rh.id} className="border-b last:border-0">
                      <td className="p-2">{new Date(rh.date).toLocaleDateString('nl-BE')}</td>
                      <td className="p-2 text-right">{fmt(Number(rh.rate))}</td>
                      <td className="p-2">{rh.reason ?? '-'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Extensions */}
      {consultant.extensions && consultant.extensions.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Verlengingen</h4>
          <div className="space-y-1">
            {consultant.extensions.map((ext) => (
              <div key={ext.id} className="text-sm flex gap-2">
                <span>Verlengd tot {new Date(ext.new_end_date).toLocaleDateString('nl-BE')}</span>
                {ext.notes && <span className="text-muted-foreground">— {ext.notes}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StopgezetDetail({ consultant }: { consultant: ConsultantWithDetails }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div><span className="text-muted-foreground">Rol:</span> {consultant.role ?? '-'}</div>
        <div><span className="text-muted-foreground">Stad:</span> {consultant.city ?? '-'}</div>
        <div><span className="text-muted-foreground">Account:</span> {consultant.account?.name ?? consultant.client_name ?? '-'}</div>
        <div>
          <span className="text-muted-foreground">Stopdatum:</span>{' '}
          {consultant.stop_date ? new Date(consultant.stop_date).toLocaleDateString('nl-BE') : '-'}
        </div>
      </div>

      {/* Stop reason */}
      {consultant.stop_reason && (
        <div>
          <h4 className="text-sm font-medium mb-1">Reden stopzetting</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{consultant.stop_reason}</p>
        </div>
      )}

      {/* Notes */}
      {consultant.notes && (
        <div>
          <h4 className="text-sm font-medium mb-1">Notities</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{consultant.notes}</p>
        </div>
      )}
    </div>
  );
}

export function ConsultantDetailModal({ consultant, open, onClose }: Props) {
  const [activeModal, setActiveModal] = useState<'stop' | 'extend' | 'rate' | 'contract-attr' | null>(null);
  const initials = `${consultant.first_name[0]}${consultant.last_name[0]}`;

  return (
    <>
      <Modal open={open} onClose={onClose} title={`${consultant.first_name} ${consultant.last_name}`} size="wide">
        <div className="space-y-6">
          {/* Header with avatar and status */}
          <div className="flex items-center gap-3">
            <Avatar path={consultant.avatar_path} fallback={initials} size="md" round />
            <div>
              <div className="font-medium">{consultant.first_name} {consultant.last_name}</div>
              <Badge className={statusColors[consultant.status]}>{statusLabels[consultant.status]}</Badge>
            </div>
          </div>

          {/* Status-specific content */}
          {consultant.status === 'bench' && <BenchDetail consultant={consultant} />}
          {consultant.status === 'actief' && <ActiveDetail consultant={consultant} />}
          {consultant.status === 'stopgezet' && <StopgezetDetail consultant={consultant} />}

          {/* Actions — only for active consultants */}
          {consultant.status === 'actief' && (
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setActiveModal('contract-attr')}>
                {consultant.contract_attribution ? 'Contract wijzigen' : 'Contract instellen'}
              </Button>
              <Button variant="outline" onClick={() => setActiveModal('rate')}>
                Tarief wijzigen
              </Button>
              <Button variant="outline" onClick={() => setActiveModal('extend')}>
                Verlengen
              </Button>
              <Button variant="destructive" onClick={() => setActiveModal('stop')}>
                Stopzetten
              </Button>
            </div>
          )}
        </div>
      </Modal>

      {activeModal === 'stop' && (
        <StopConsultantModal
          consultantId={consultant.id}
          open
          onClose={() => setActiveModal(null)}
          onSuccess={onClose}
        />
      )}
      {activeModal === 'extend' && (
        <ExtendConsultantModal
          consultantId={consultant.id}
          open
          onClose={() => setActiveModal(null)}
          onSuccess={onClose}
        />
      )}
      {activeModal === 'rate' && (
        <RateChangeModal
          consultantId={consultant.id}
          open
          onClose={() => setActiveModal(null)}
          onSuccess={onClose}
        />
      )}
      {activeModal === 'contract-attr' && (
        <ContractAttributionModal
          consultantId={consultant.id}
          existing={consultant.contract_attribution}
          open
          onClose={() => setActiveModal(null)}
          onSaved={() => {
            setActiveModal(null);
            onClose();
          }}
        />
      )}
    </>
  );
}
