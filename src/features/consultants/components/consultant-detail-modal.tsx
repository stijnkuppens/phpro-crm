'use client';

import { ExternalLink } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Avatar } from '@/components/admin/avatar';
import { Modal, ModalFooter } from '@/components/admin/modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency } from '@/lib/format';
import { createBrowserClient } from '@/lib/supabase/client';
import {
  CONSULTANT_PRIORITY_STYLES,
  CONSULTANT_SELECT,
  CONSULTANT_STATUS_LABELS,
  CONSULTANT_STATUS_STYLES,
  type ConsultantWithDetails,
  contractStatusColors,
  contractStatusDescriptions,
} from '../types';
import { getContractStatus, getCurrentRate } from '../utils';
import { ContractAttributionModal } from './contract-attribution-modal';
import { ExtendConsultantModal } from './extend-consultant-modal';
import { RateChangeModal } from './rate-change-modal';
import { StopConsultantModal } from './stop-consultant-modal';

type Props = {
  consultant: ConsultantWithDetails;
  open: boolean;
  onClose: () => void;
};

function BenchDetail({ consultant }: { consultant: ConsultantWithDetails }) {
  return (
    <div className="space-y-6">
      {/* Priority & availability */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Prioriteit:</span>{' '}
          {consultant.priority ? (
            <Badge className={CONSULTANT_PRIORITY_STYLES[consultant.priority]}>{consultant.priority}</Badge>
          ) : (
            '-'
          )}
        </div>
        <div>
          <span className="text-muted-foreground">Stad:</span> {consultant.city ?? '-'}
        </div>
        <div>
          <span className="text-muted-foreground">Beschikbaar vanaf:</span>{' '}
          {consultant.available_date ? new Date(consultant.available_date).toLocaleDateString('nl-BE') : '-'}
        </div>
        <div>
          <span className="text-muted-foreground">Tarief:</span>{' '}
          {consultant.min_hourly_rate || consultant.max_hourly_rate
            ? `${consultant.min_hourly_rate ? formatCurrency(consultant.min_hourly_rate) : '?'} - ${consultant.max_hourly_rate ? formatCurrency(consultant.max_hourly_rate) : '?'}/u`
            : '-'}
        </div>
      </div>

      {/* Roles */}
      {consultant.roles && consultant.roles.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Rollen</h4>
          <div className="flex flex-wrap gap-1">
            {consultant.roles.map((role) => (
              <Badge key={role} className="bg-primary/15 text-primary-action border-0">
                {role}
              </Badge>
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
              <Badge key={tech} className="bg-muted text-muted-foreground border-0">
                {tech}
              </Badge>
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
        <div>
          <span className="text-muted-foreground">Rol:</span> {consultant.role ?? '-'}
        </div>
        <div>
          <span className="text-muted-foreground">Stad:</span> {consultant.city ?? '-'}
        </div>
        <div>
          <span className="text-muted-foreground">Account:</span>{' '}
          {consultant.account?.name ?? consultant.client_name ?? '-'}
        </div>
        <div>
          <span className="text-muted-foreground">Contract:</span>{' '}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={<Badge className={`cursor-help ${contractStatusColors[status]}`}>{status}</Badge>}
              />
              <TooltipContent>{contractStatusDescriptions[status]}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div>
          <span className="text-muted-foreground">Huidig tarief:</span> {formatCurrency(rate)}/u
        </div>
        <div>
          <span className="text-muted-foreground">Periode:</span>{' '}
          {consultant.start_date ? new Date(consultant.start_date).toLocaleDateString('nl-BE') : '-'} -{' '}
          {consultant.is_indefinite
            ? 'onbepaald'
            : consultant.end_date
              ? new Date(consultant.end_date).toLocaleDateString('nl-BE')
              : '-'}
        </div>
        <div>
          <span className="text-muted-foreground">Opzegtermijn:</span> {consultant.notice_period_days ?? 30} dagen
        </div>
      </div>

      {/* Contract Attribution */}
      {consultant.contract_attribution && (
        <div>
          <h4 className="text-sm font-medium mb-2">Contract attributie</h4>
          <div className="border rounded-md p-3 text-sm space-y-1">
            <div>
              <span className="text-muted-foreground">Type:</span>{' '}
              <Badge
                className={
                  consultant.contract_attribution.type === 'rechtstreeks'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                }
              >
                {consultant.contract_attribution.type === 'rechtstreeks' ? 'Rechtstreeks' : 'Cronos'}
              </Badge>
            </div>
            {consultant.contract_attribution.type === 'cronos' && (
              <>
                {consultant.contract_attribution.cc_name && (
                  <div>
                    <span className="text-muted-foreground">CC Naam:</span> {consultant.contract_attribution.cc_name}
                  </div>
                )}
                {consultant.contract_attribution.cc_contact_person && (
                  <div>
                    <span className="text-muted-foreground">CC Contactpersoon:</span>{' '}
                    {consultant.contract_attribution.cc_contact_person}
                  </div>
                )}
                {consultant.contract_attribution.cc_email && (
                  <div>
                    <span className="text-muted-foreground">CC E-mail:</span> {consultant.contract_attribution.cc_email}
                  </div>
                )}
                {consultant.contract_attribution.cc_phone && (
                  <div>
                    <span className="text-muted-foreground">CC Telefoon:</span>{' '}
                    {consultant.contract_attribution.cc_phone}
                  </div>
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
                  <th className="text-left p-2">Gewijzigd op</th>
                  <th className="text-left p-2">Actief vanaf</th>
                  <th className="text-right p-2">Tarief</th>
                  <th className="text-left p-2">Reden</th>
                </tr>
              </thead>
              <tbody>
                {[...consultant.rate_history]
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((rh) => (
                    <tr key={rh.id} className="border-b last:border-0">
                      <td className="p-2 text-muted-foreground">
                        {new Date(rh.created_at).toLocaleDateString('nl-BE')}{' '}
                        {new Date(rh.created_at).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-2">{new Date(rh.date).toLocaleDateString('nl-BE')}</td>
                      <td className="p-2 text-right">{formatCurrency(Number(rh.rate))}</td>
                      <td className="p-2 text-muted-foreground">{rh.reason ?? '-'}</td>
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
          <div className="border rounded-md">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-2">Gewijzigd op</th>
                  <th className="text-left p-2">Nieuwe einddatum</th>
                  <th className="text-left p-2">Notities</th>
                </tr>
              </thead>
              <tbody>
                {[...consultant.extensions]
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((ext) => (
                    <tr key={ext.id} className="border-b last:border-0">
                      <td className="p-2 text-muted-foreground">
                        {new Date(ext.created_at).toLocaleDateString('nl-BE')}{' '}
                        {new Date(ext.created_at).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-2">{new Date(ext.new_end_date).toLocaleDateString('nl-BE')}</td>
                      <td className="p-2 text-muted-foreground">{ext.notes ?? '-'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
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
        <div>
          <span className="text-muted-foreground">Rol:</span> {consultant.role ?? '-'}
        </div>
        <div>
          <span className="text-muted-foreground">Stad:</span> {consultant.city ?? '-'}
        </div>
        <div>
          <span className="text-muted-foreground">Account:</span>{' '}
          {consultant.account?.name ?? consultant.client_name ?? '-'}
        </div>
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

export function ConsultantDetailModal({ consultant: initialConsultant, open, onClose }: Props) {
  const [consultant, setConsultant] = useState(initialConsultant);
  const [activeModal, setActiveModal] = useState<'stop' | 'extend' | 'rate' | 'contract-attr' | null>(null);
  const initials = `${consultant.first_name[0]}${consultant.last_name[0]}`;

  // Client-side re-fetch is intentional here: after a sub-modal action (stop, extend,
  // rate change, contract attribution), the modal stays open and needs fresh data.
  // The parent list component doesn't have a mechanism to push updated data into
  // an already-open modal, so we re-fetch the single consultant directly.
  const refresh = useCallback(async () => {
    const supabase = createBrowserClient();
    const { data } = await supabase.from('consultants').select(CONSULTANT_SELECT).eq('id', consultant.id).single();
    if (data) setConsultant(data as unknown as ConsultantWithDetails);
  }, [consultant.id]);

  // Re-fetch when a sub-modal closes after a successful action
  const handleSubModalSuccess = useCallback(() => {
    setActiveModal(null);
    refresh();
  }, [refresh]);

  return (
    <>
      <Modal open={open} onClose={onClose} title={`${consultant.first_name} ${consultant.last_name}`} size="wide">
        <div className="space-y-6">
          {/* Header with avatar and status */}
          <div className="flex items-center gap-3">
            <Avatar path={consultant.avatar_path} fallback={initials} size="md" round />
            <div>
              <div className="font-medium">
                {consultant.first_name} {consultant.last_name}
              </div>
              <Badge className={CONSULTANT_STATUS_STYLES[consultant.status]}>
                {CONSULTANT_STATUS_LABELS[consultant.status]}
              </Badge>
            </div>
          </div>

          {/* Status-specific content */}
          {consultant.status === 'bench' && <BenchDetail consultant={consultant} />}
          {consultant.status === 'actief' && <ActiveDetail consultant={consultant} />}
          {consultant.status === 'stopgezet' && <StopgezetDetail consultant={consultant} />}

          {/* Actions — only for active consultants */}
          {consultant.status === 'actief' && (
            <ModalFooter className="flex-wrap justify-end">
              <Button variant="outline" size="sm" onClick={() => setActiveModal('contract-attr')}>
                {consultant.contract_attribution ? 'Contract wijzigen' : 'Contract instellen'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setActiveModal('rate')}>
                Tarief wijzigen
              </Button>
              <Button variant="outline" size="sm" onClick={() => setActiveModal('extend')}>
                Verlengen
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setActiveModal('stop')}>
                Stopzetten
              </Button>
            </ModalFooter>
          )}
        </div>
      </Modal>

      {activeModal === 'stop' && (
        <StopConsultantModal
          consultantId={consultant.id}
          open
          onClose={() => setActiveModal(null)}
          onSuccess={handleSubModalSuccess}
        />
      )}
      {activeModal === 'extend' && (
        <ExtendConsultantModal
          consultantId={consultant.id}
          open
          onClose={() => setActiveModal(null)}
          onSuccess={handleSubModalSuccess}
        />
      )}
      {activeModal === 'rate' && (
        <RateChangeModal
          consultantId={consultant.id}
          open
          onClose={() => setActiveModal(null)}
          onSuccess={handleSubModalSuccess}
        />
      )}
      {activeModal === 'contract-attr' && (
        <ContractAttributionModal
          consultantId={consultant.id}
          existing={consultant.contract_attribution}
          open
          onClose={() => setActiveModal(null)}
          onSaved={handleSubModalSuccess}
        />
      )}
    </>
  );
}
