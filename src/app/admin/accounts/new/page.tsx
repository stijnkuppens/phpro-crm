import { requirePermission } from '@/lib/require-permission';
import { AccountForm } from '@/features/accounts/components/account-form';

export default async function NewAccountPage() {
  await requirePermission('accounts.write');
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Nieuw Account</h1>
      <AccountForm />
    </div>
  );
}
