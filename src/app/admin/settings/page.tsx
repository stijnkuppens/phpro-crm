import { SettingsForm } from '@/features/settings/components/settings-form';
import { getSettings } from '@/features/settings/queries/get-settings';

export default async function SettingsGeneralPage() {
  const settings = await getSettings();

  return (
    <div className="max-w-2xl">
      <SettingsForm initialData={settings} />
    </div>
  );
}
