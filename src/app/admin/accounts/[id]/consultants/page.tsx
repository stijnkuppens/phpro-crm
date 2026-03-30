import { getAccount } from '@/features/accounts/queries/get-account';
import { AccountConsultantsTab } from '@/features/consultants/components/account-consultants-tab';
import { getConsultantsByAccount } from '@/features/consultants/queries/get-consultants-by-account';
import { getReferenceOptions } from '@/features/reference-data/queries/get-reference-options';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ConsultantsPage({ params }: Props) {
  const { id } = await params;
  const [consultants, rolesRaw, account] = await Promise.all([
    getConsultantsByAccount(id, true),
    getReferenceOptions('ref_consultant_roles'),
    getAccount(id),
  ]);
  const roles = rolesRaw.map((r) => ({ value: r.name, label: r.name }));
  return (
    <AccountConsultantsTab
      accountId={id}
      accountName={account?.name ?? ''}
      consultants={consultants}
      roles={roles}
    />
  );
}
