import { PageHeader } from '@/components/admin/page-header';
import { getTasks } from '@/features/tasks/queries/get-tasks';
import { getTaskFilterOptions } from '@/features/tasks/queries/get-task-filter-options';
import { TaskList } from '@/features/tasks/components/task-list';

export default async function TasksPage() {
  const [{ data, count }, filterOptions] = await Promise.all([
    getTasks(),
    getTaskFilterOptions(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Taken"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Taken' },
        ]}
      />
      <TaskList initialData={data} initialCount={count} filterOptions={filterOptions} />
    </div>
  );
}
