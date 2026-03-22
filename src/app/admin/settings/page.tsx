import { PageHeader } from '@/components/admin/page-header';
import { getSettings } from '@/features/settings/queries/get-settings';
import { SettingsForm } from '@/features/settings/components/settings-form';

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Instellingen"
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Instellingen' }]}
      />
      <SettingsForm initialData={settings} />
    </div>
  );
}
