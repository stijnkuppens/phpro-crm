'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

type Props = {
  /** Is this an edit form (vs create)? Shows "save and close" only on edit */
  isEdit: boolean;
  loading: boolean;
  /** Ref to the form element — needed to trigger submit from "save and close" */
  formRef: React.RefObject<HTMLFormElement | null>;
  /** Called when "save and close" is clicked, before submit. Set your close flag here. */
  onSaveAndClose: () => void;
  /** HTML form id — allows placing buttons outside the <form> tag */
  formId?: string;
  labels?: {
    create?: string;
    update?: string;
    updateAndClose?: string;
    saving?: string;
  };
};

const defaults = {
  create: 'Aanmaken',
  update: 'Bijwerken',
  updateAndClose: 'Bijwerken en sluiten',
  saving: 'Opslaan...',
};

export function FormActions({ isEdit, loading, formRef, onSaveAndClose, formId, labels }: Props) {
  const l = { ...defaults, ...labels };
  const [closing, setClosing] = useState(false);

  return (
    <>
      {isEdit && (
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={() => {
            setClosing(true);
            onSaveAndClose();
            formRef.current?.requestSubmit();
          }}
        >
          <Save />
          {loading && closing ? l.saving : l.updateAndClose}
        </Button>
      )}
      <Button
        type="submit"
        form={formId}
        disabled={loading}
        onClick={() => { setClosing(false); }}
      >
        <Save />
        {loading && !closing ? l.saving : isEdit ? l.update : l.create}
      </Button>
    </>
  );
}
