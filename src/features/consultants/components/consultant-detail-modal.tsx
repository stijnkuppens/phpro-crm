'use client';

import { useState } from 'react';
import { Modal } from '@/components/admin/modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { getContractStatus, getCurrentRate, contractStatusColors, type ActiveConsultantWithDetails } from '../types';
import { StopConsultantModal } from './stop-consultant-modal';
import { ExtendConsultantModal } from './extend-consultant-modal';
import { RateChangeModal } from './rate-change-modal';
import { ContractAttributionModal } from './contract-attribution-modal';

type Props = {
  consultant: ActiveConsultantWithDetails;
  open: boolean;
  onClose: () => void;
};

const fmt = (n: number) =>
  new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' }).format(n);

export function ConsultantDetailModal({ consultant, open, onClose }: Props) {
  const [activeModal, setActiveModal] = useState<'stop' | 'extend' | 'rate' | 'contract-attr' | null>(null);
  const status = getContractStatus(consultant);
  const rate = getCurrentRate(consultant);

  return (
    <>
      <Modal open={open} onClose={onClose} title={`${consultant.first_name} ${consultant.last_name}`} size="wide">
        <div className="space-y-6">
          {/* Header info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Rol:</span> {consultant.role ?? '-'}</div>
            <div><span className="text-muted-foreground">Stad:</span> {consultant.city ?? '-'}</div>
            <div><span className="text-muted-foreground">Account:</span> {consultant.account?.name ?? consultant.client_name ?? '-'}</div>
            <div>
              <span className="text-muted-foreground">Status:</span>{' '}
              <Badge className={contractStatusColors[status]}>{status}</Badge>
            </div>
            <div><span className="text-muted-foreground">Huidig tarief:</span> {fmt(rate)}/u</div>
            <div>
              <span className="text-muted-foreground">Periode:</span>{' '}
              {new Date(consultant.start_date).toLocaleDateString('nl-BE')} -{' '}
              {consultant.is_indefinite ? 'onbepaald' : consultant.end_date ? new Date(consultant.end_date).toLocaleDateString('nl-BE') : '-'}
            </div>
            <div><span className="text-muted-foreground">Opzegtermijn:</span> {consultant.notice_period_days ?? 30} dagen</div>
          </div>

          {/* Contract Attribution */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">Contract attributie</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveModal('contract-attr')}
              >
                {consultant.contract_attribution ? 'Contract wijzigen' : 'Contract instellen'}
              </Button>
            </div>
            {consultant.contract_attribution ? (
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
            ) : (
              <p className="text-sm text-muted-foreground">Geen contract attributie</p>
            )}
          </div>

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

          {/* Actions */}
          {!consultant.is_stopped && (
            <div className="flex gap-2 justify-end">
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
