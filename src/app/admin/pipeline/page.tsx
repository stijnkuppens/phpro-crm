import { PageHeader } from '@/components/admin/page-header';
import { getPipelineEntries } from '@/features/pipeline/queries/get-pipeline-entries';
import { getDivisions } from '@/features/revenue/queries/get-divisions';
import { PipelinePageClient } from '@/features/pipeline/components/pipeline-page-client';

const PIPELINE_YEAR = new Date().getFullYear();

export default async function PipelineAnalyticsPage() {
  const [entries, divisions] = await Promise.all([
    getPipelineEntries(PIPELINE_YEAR),
    getDivisions(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipeline"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Pipeline' },
        ]}
      />
      <PipelinePageClient entries={entries} divisions={divisions} year={PIPELINE_YEAR} />
    </div>
  );
}
