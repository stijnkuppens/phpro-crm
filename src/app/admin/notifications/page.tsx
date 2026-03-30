import { PageHeader } from '@/components/admin/page-header';
import { NotificationList } from '@/features/notifications/components/notification-list';
import { getNotifications } from '@/features/notifications/queries/get-notifications';

export default async function NotificationsPage() {
  const notifications = await getNotifications();

  return (
    <div className="space-y-6">
      <PageHeader title="Meldingen" breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Meldingen' }]} />
      <NotificationList initialData={notifications} />
    </div>
  );
}
