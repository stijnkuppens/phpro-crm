'use client';

import { useRef, useState } from 'react';
import { PageHeader } from '@/components/admin/page-header';
import { FormActions } from '@/components/admin/form-actions';
import { AccountForm } from './account-form';
import type { AccountReferenceData, AccountFormValues } from '../types';

type Props = {
  account: { id: string; name: string };
  referenceData: AccountReferenceData;
  defaultValues: Parameters<typeof AccountForm>[0]['defaultValues'];
  breadcrumbs: { label: string; href?: string }[];
};

export function AccountEditPageClient({ account, referenceData, defaultValues, breadcrumbs }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${account.name} bewerken`}
        breadcrumbs={breadcrumbs}
        actions={
          <FormActions
            isEdit={true}
            loading={loading}
            formRef={formRef}
            formId="account-form"
            onSaveAndClose={() => {
              // The form reads this from a data attribute
              const form = formRef.current;
              if (form) form.dataset.closeAfterSave = 'true';
            }}
          />
        }
      />
      <AccountForm
        referenceData={referenceData}
        defaultValues={defaultValues}
        formRef={formRef}
        onLoadingChange={setLoading}
      />
    </div>
  );
}
