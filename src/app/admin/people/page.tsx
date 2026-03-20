import { PageHeader } from '@/components/admin/page-header';
import { getEmployees } from '@/features/people/queries/get-employees';
import { EmployeeList } from '@/features/people/components/employee-list';

export default async function PeoplePage() {
  const { data, count } = await getEmployees();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Medewerkers"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Medewerkers' },
        ]}
      />
      <EmployeeList initialData={data} initialCount={count} />
    </div>
  );
}
