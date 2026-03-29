'use client';

import { useActionState } from 'react';
import { Modal } from '@/components/admin/modal';
import { useDealForm } from '@/features/deals/components/deal-form-context';
import { DealFormProvider } from '@/features/deals/components/deal-form-provider';
import type { DealEditModalProps } from '@/features/deals/components/deal-form-provider';
import { ClosedDealBanner } from '@/features/deals/components/deal-form-closed-banner';
import { DealFormLeftColumn } from '@/features/deals/components/deal-form-left-column';
import { DealFormRightColumn } from '@/features/deals/components/deal-form-right-column';
import { DealFormFooter } from '@/features/deals/components/deal-form-footer';

function DealFormContent() {
  const { actions, meta } = useDealForm();

  const [, formAction] = useActionState(async (_prev: null) => {
    await actions.handleSave();
    return null;
  }, null);

  return (
    <Modal open title={meta.isEdit ? 'Deal bewerken' : 'Nieuwe deal'} onClose={actions.onClose} size="extra-wide">
      <form action={formAction}>
        <ClosedDealBanner />
        <div className="grid grid-cols-2 gap-6">
          <DealFormLeftColumn />
          <DealFormRightColumn />
        </div>
        <DealFormFooter />
      </form>
    </Modal>
  );
}

export function DealEditModal(props: DealEditModalProps) {
  return (
    <DealFormProvider {...props}>
      <DealFormContent />
    </DealFormProvider>
  );
}
