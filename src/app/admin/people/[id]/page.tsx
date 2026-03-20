import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PageHeader } from '@/components/admin/page-header';
import { getEmployee } from '@/features/people/queries/get-employee';
import { EmployeeDetail } from '@/features/people/components/employee-detail';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const employee = await getEmployee(id);
  return { title: employee ? `${employee.first_name} ${employee.last_name}` : 'Medewerker' };
}

export default async function PersonDetailPage({ params }: Props) {
  const { id } = await params;
  const employee = await getEmployee(id);
  if (!employee) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${employee.first_name} ${employee.last_name}`}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Medewerkers', href: '/admin/people' },
          { label: `${employee.first_name} ${employee.last_name}` },
        ]}
      />
      <EmployeeDetail employee={employee} />
    </div>
  );
}
