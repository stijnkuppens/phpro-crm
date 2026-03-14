import { PageHeader } from '@/components/admin/page-header';
import { getTasks } from '@/features/tasks/queries/get-tasks';
import { TaskList } from '@/features/tasks/components/task-list';

export default async function TasksPage() {
  const { data, count } = await getTasks();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Taken"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Taken' },
        ]}
      />
      <TaskList initialData={data} initialCount={count} />
    </div>
  );
}
