'use client';

import { useState } from 'react';
import { Modal } from '@/components/admin/modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getContractStatus, getCurrentRate, type ActiveConsultantWithDetails, type ContractStatus } from '../types';
import { StopConsultantModal } from './stop-consultant-modal';
import { ExtendConsultantModal } from './extend-consultant-modal';
import { RateChangeModal } from './rate-change-modal';

type Props = {
  consultant: ActiveConsultantWithDetails;
  open: boolean;
  onClose: () => void;
};

const statusColors: Record<ContractStatus, string> = {
  actief: 'bg-green-100 text-green-800',
  waarschuwing: 'bg-yellow-100 text-yellow-800',
  kritiek: 'bg-red-100 text-red-800',
  verlopen: 'bg-gray-100 text-gray-800',
  onbepaald: 'bg-blue-100 text-blue-800',
  stopgezet: 'bg-gray-300 text-gray-600',
};

const fmt = (n: number) =>
  new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' }).format(n);

export function ConsultantDetailModal({ consultant, open, onClose }: Props) {
  const [activeModal, setActiveModal] = useState<'stop' | 'extend' | 'rate' | null>(null);
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
              <Badge className={statusColors[status]}>{status}</Badge>
            </div>
            <div><span className="text-muted-foreground">Huidig tarief:</span> {fmt(rate)}/u</div>
            <div>
              <span className="text-muted-foreground">Periode:</span>{' '}
              {new Date(consultant.start_date).toLocaleDateString('nl-BE')} -{' '}
              {consultant.is_indefinite ? 'onbepaald' : consultant.end_date ? new Date(consultant.end_date).toLocaleDateString('nl-BE') : '-'}
            </div>
            <div><span className="text-muted-foreground">Opzegtermijn:</span> {consultant.notice_period_days ?? 30} dagen</div>
          </div>

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
    </>
  );
}
