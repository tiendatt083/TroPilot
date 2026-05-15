import {
  formatNotificationDateTime,
  getNotificationTargetLabel
} from '../utils/notificationOptions.js';

export default function NotificationTable({ notifications, onMarkRead, processingId }) {
  return (
    <div className="table-wrap">
      <table className="data-table notification-table">
        <thead>
          <tr>
            <th>Notification</th>
            <th>Target</th>
            <th>Created by</th>
            <th>Created</th>
            <th>Read status</th>
            {onMarkRead && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {notifications.map((notification) => (
            <tr key={notification.id}>
              <td>
                <strong>{notification.title}</strong>
                <span className="table-subtext">{notification.content}</span>
              </td>
              <td>{getNotificationTargetLabel(notification.targetType)}</td>
              <td>
                <strong>{notification.createdByName}</strong>
                <span className="table-subtext">{notification.createdByRole}</span>
              </td>
              <td>{formatNotificationDateTime(notification.createdAt)}</td>
              <td>
                <span className={notification.read ? 'status-pill read-status-read' : 'status-pill read-status-unread'}>
                  {notification.read ? 'Read' : 'Unread'}
                </span>
                {notification.readAt && <span className="table-subtext">{formatNotificationDateTime(notification.readAt)}</span>}
              </td>
              {onMarkRead && (
                <td>
                  <button
                    className="secondary-button compact-button"
                    type="button"
                    disabled={notification.read || processingId === notification.id}
                    onClick={() => onMarkRead(notification)}
                  >
                    Mark read
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {notifications.length === 0 && <div className="empty-state flat-empty-state">No notifications found.</div>}
    </div>
  );
}
