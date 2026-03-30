import { PageHeader } from '@/components/admin/page-header';
import { SettingsSubNav } from '@/features/settings/components/settings-sub-nav';

type Props = {
  children: React.ReactNode;
};

export default function SettingsLayout({ children }: Props) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Instellingen"
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Instellingen' }]}
      />
      <SettingsSubNav />
      {children}
    </div>
  );
}
