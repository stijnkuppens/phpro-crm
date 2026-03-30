import type { Metadata } from 'next';
import { PageHeader } from '@/components/admin/page-header';
import { JobList } from '@/features/jobs/components/job-list';
import { getJobs } from '@/features/jobs/queries/get-jobs';
import { createServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Jobs' };

export default async function JobsPage() {
  const [{ data, count }, supabase] = await Promise.all([getJobs(), createServerClient()]);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-6">
      <PageHeader title="Jobs" breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Jobs' }]} />
      <JobList initialData={data} initialCount={count} userId={user!.id} />
    </div>
  );
}
