'use client';

import { useRef, useState } from 'react';
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
  const [loading, setLoading] = useState(false);

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
            disabled={loading}
          >
            <Save />
            {loading ? 'Opslaan...' : 'Aanmaken'}
          </Button>
        }
      />
      <AccountForm
        referenceData={referenceData}
        formRef={formRef}
        onLoadingChange={setLoading}
      />
    </div>
  );
}
