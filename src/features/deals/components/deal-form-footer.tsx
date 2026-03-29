'use client';

import { Save, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { Button } from '@/components/ui/button';
import { SubmitButton } from '@/components/ui/submit-button';
import { useDealForm } from '@/features/deals/components/deal-form-context';

export function DealFormFooter() {
  const { state, actions, meta } = useDealForm();

  return (
    <div className="flex justify-between mt-6 pt-4 border-t">
      <div>
        {meta.isEdit && (
          <ConfirmDialog
            title="Deal verwijderen"
            description="Weet je zeker dat je deze deal wilt verwijderen? Dit kan niet ongedaan worden."
            onConfirm={actions.handleDelete}
            variant="destructive"
            open={state.confirmDeleteOpen}
            onOpenChange={actions.setConfirmDeleteOpen}
          />
        )}
        {meta.isEdit && (
          <Button type="button" variant="destructive" size="sm" onClick={() => actions.setConfirmDeleteOpen(true)}>
            <Trash2 />
            Verwijderen
          </Button>
        )}
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={actions.onClose}>Annuleren</Button>
        <SubmitButton icon={<Save />} disabled={!state.title}>
          {meta.isEdit ? 'Bijwerken' : 'Aanmaken'}
        </SubmitButton>
      </div>
    </div>
  );
}
