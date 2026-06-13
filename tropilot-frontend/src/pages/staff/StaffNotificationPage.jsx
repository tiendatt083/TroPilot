import * as notificationApi from '../../features/notifications/api.js';
import UserNotificationPage from '../../components/UserNotificationPage.jsx';

export default function StaffNotificationPage() {
  return <UserNotificationPage getNotifications={notificationApi.getStaffNotifications} eyebrow="Operations staff" />;
}
