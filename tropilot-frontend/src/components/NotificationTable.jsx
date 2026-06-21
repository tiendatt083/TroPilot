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
    <div className="table-wrap">
      <table className="data-table notification-table">
        <thead>
          <tr>
            <th>{t('tables.notifications.title')}</th>
            {showTarget && <th>{t('tables.common.target')}</th>}
            <th>{t('tables.common.createdBy')}</th>
            <th>{t('tables.common.created')}</th>
            {showReadStatus && <th>{t('tables.notifications.readStatus')}</th>}
            {onMarkRead && <th>{t('tables.common.actions')}</th>}
          </tr>
        </thead>
        <tbody>
          {notifications.map((notification) => (
            <tr key={notification.id}>
              <td>
                <strong>{notification.title}</strong>
                <span className="table-subtext">{notification.content}</span>
              </td>
              {showTarget && (
                <td>
                  <strong>{formatEnumLabel(t, 'notificationTarget', notification.targetType)}</strong>
                  <span className="table-subtext">{getBuildingLabel(notification, t)}</span>
                  {notification.targetUserNames?.length > 0 && (
                    <span className="table-subtext">{notification.targetUserNames.join(', ')}</span>
                  )}
                </td>
              )}
              <td>
                <strong>{notification.createdByName}</strong>
                <span className="table-subtext">{notification.createdByRole}</span>
              </td>
              <td>{formatDateTime(notification.createdAt, t)}</td>
              {showReadStatus && (
                <td>
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
