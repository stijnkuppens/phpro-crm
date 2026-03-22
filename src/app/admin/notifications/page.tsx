import { getNotifications } from '@/features/notifications/queries/get-notifications';
import { NotificationList } from '@/features/notifications/components/notification-list';

export default async function NotificationsPage() {
  const notifications = await getNotifications();

  return <NotificationList initialData={notifications} />;
}
