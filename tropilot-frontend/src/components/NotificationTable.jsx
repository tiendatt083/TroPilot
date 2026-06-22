import { useTranslation } from 'react-i18next';
import { formatDateTime, formatEnumLabel } from '../utils/i18nFormat.js';

function getBuildingLabel(notification, t) {
  if (notification.allBuildings) {
    return t('tables.notifications.allBuildings');
  }

  return notification.buildingNames?.length
    ? notification.buildingNames.join(', ')
    : t('tables.notifications.selectedBuildings');
}

export default function NotificationTable({
  notifications,
  onMarkRead,
  processingId,
  showReadStatus = true,
  showTarget = true
}) {
  const { t } = useTranslation();

  return (
    <div className="table-wrap notification-table-wrap">
      <table className="data-table notification-table">
        <thead>
          <tr>
            <th className="notification-title-column">{t('tables.notifications.title')}</th>
            {showTarget && <th className="notification-target-column">{t('tables.common.target')}</th>}
            <th className="notification-author-column">{t('tables.common.createdBy')}</th>
            <th className="notification-date-column">{t('tables.common.created')}</th>
            {showReadStatus && <th className="notification-status-column">{t('tables.notifications.readStatus')}</th>}
            {onMarkRead && <th className="notification-action-column">{t('tables.common.actions')}</th>}
          </tr>
        </thead>
        <tbody>
          {notifications.map((notification) => (
            <tr key={notification.id}>
              <td className="notification-message-cell">
                <strong className="notification-title-text">{notification.title}</strong>
                <span className="table-subtext notification-content-text">{notification.content}</span>
              </td>
              {showTarget && (
                <td className="notification-target-cell">
                  <span className="status-pill notification-target-pill">
                    {formatEnumLabel(t, 'notificationTarget', notification.targetType)}
                  </span>
                  <span className="table-subtext notification-meta-line">{getBuildingLabel(notification, t)}</span>
                  {notification.targetUserNames?.length > 0 && (
                    <span className="table-subtext notification-meta-line">{notification.targetUserNames.join(', ')}</span>
                  )}
                </td>
              )}
              <td className="notification-author-cell">
                <strong>{notification.createdByName}</strong>
                <span className="table-subtext notification-meta-line">{notification.createdByRole}</span>
              </td>
              <td className="notification-date-cell">{formatDateTime(notification.createdAt, t)}</td>
              {showReadStatus && (
                <td className="notification-status-cell">
                  <span className={notification.read ? 'status-pill read-status-read' : 'status-pill read-status-unread'}>
                    {notification.read ? t('enum.readStatus.READ') : t('enum.readStatus.UNREAD')}
                  </span>
                  {notification.readAt && <span className="table-subtext">{formatDateTime(notification.readAt, t)}</span>}
                </td>
              )}
              {onMarkRead && (
                <td>
                  <button
                    className="secondary-button compact-button"
                    type="button"
                    disabled={notification.read || processingId === notification.id}
                    onClick={() => onMarkRead(notification)}
                  >
                    {t('tables.notifications.markRead')}
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {notifications.length === 0 && <div className="empty-state flat-empty-state">{t('tables.notifications.empty')}</div>}
    </div>
  );
}
