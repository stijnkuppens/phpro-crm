import { PageHeader } from '@/components/admin/page-header';
import { AuditList } from '@/features/audit/components/audit-list';
import { getAuditLogs } from '@/features/audit/queries/get-audit-logs';

export default async function AuditPage() {
  const { data, count } = await getAuditLogs();

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Log" breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Audit Log' }]} />
      <AuditList initialData={data} initialCount={count} />
    </div>
  );
}
