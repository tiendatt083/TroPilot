import * as notificationApi from '../../features/notifications/api.js';
import UserNotificationPage from '../../components/UserNotificationPage.jsx';

export default function ResidentNotificationPage() {
  return <UserNotificationPage getNotifications={notificationApi.getResidentNotifications} eyebrow="Head resident" />;
}
