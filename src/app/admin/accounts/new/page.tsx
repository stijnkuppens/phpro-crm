import { requirePermission } from '@/lib/require-permission';

export default async function NewAccountPage() {
  await requirePermission('accounts.write');
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Nieuw Account</h1>
      <p className="text-muted-foreground">Account formulier wordt geladen...</p>
    </div>
  );
}
