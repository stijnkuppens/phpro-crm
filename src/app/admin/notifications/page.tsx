import { getNotifications } from '@/features/notifications/queries/get-notifications';
import { NotificationList } from '@/features/notifications/components/notification-list';
import { PageHeader } from '@/components/admin/page-header';

export default async function NotificationsPage() {
  const notifications = await getNotifications();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meldingen"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Meldingen' },
        ]}
      />
      <NotificationList initialData={notifications} />
    </div>
  );
}
