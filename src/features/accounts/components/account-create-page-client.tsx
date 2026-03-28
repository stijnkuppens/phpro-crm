'use client';

import { useRef } from 'react';
import { PageHeader } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { AccountForm } from './account-form';
import type { AccountReferenceData } from '../types';

type Props = {
  referenceData: AccountReferenceData;
};

export function AccountCreatePageClient({ referenceData }: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nieuw Account"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Accounts', href: '/admin/accounts' },
          { label: 'Nieuw Account' },
        ]}
        actions={
          <Button
            type="submit"
            form="account-form"
          >
            <Save />
            Aanmaken
          </Button>
        }
      />
      <AccountForm
        referenceData={referenceData}
        formRef={formRef}
      />
    </div>
  );
}
