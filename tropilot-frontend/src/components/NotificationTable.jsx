import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ActionDialog from './common/ActionDialog.jsx';
import { formatDateTime } from '../utils/i18nFormat.js';
import { translateInterfaceText } from '../utils/interfaceTranslations.js';

/** Ghép một số phần tử đầu thành chuỗi và báo số lượng còn lại khi danh sách quá dài. */
function joinLimited(items = [], limit = 2) {
  const cleanItems = items.filter(Boolean);

  if (cleanItems.length <= limit) {
    return cleanItems.join(', ');
  }

  return `${cleanItems.slice(0, limit).join(', ')} +${cleanItems.length - limit}`;
}

/** Lấy nhãn tòa nhà nhận thông báo. */
function getBuildingLabel(notification, t) {
  if (notification.allBuildings) {
    return t('tables.notifications.allBuildings');
  }

  return notification.buildingNames?.length
    ? notification.buildingNames.join(', ')
    : t('tables.notifications.selectedBuildings');
}

/** Tạo nhãn người nhận ngắn gọn cho cột bảng. */
function getCompactTargetLabel(notification, t) {
  const targetCount = notification.targetUserNames?.length || 0;

  if (notification.targetType === 'SELECTED_USERS') {
    return targetCount > 1
      ? t('tables.notifications.targetCompact.selectedCount', { count: targetCount })
      : t('tables.notifications.targetCompact.selectedOne');
  }

  if (notification.targetType === 'ALL_RESIDENT_HEADS') {
    return t('tables.notifications.targetCompact.residentHeads');
  }

  if (notification.targetType === 'STAFF') {
    return t('tables.notifications.targetCompact.staff');
  }

  if (notification.targetType === 'ALL') {
    return t('tables.notifications.targetCompact.all');
  }

  return t('tables.notifications.targetCompact.target');
}

/** Tạo mô tả phụ ngắn gọn về phạm vi gửi thông báo. */
function getCompactTargetDetail(notification, t) {
  const buildingLabel = getBuildingLabel(notification, t);
  const userLabel = joinLimited(notification.targetUserNames);

  if (notification.targetType === 'SELECTED_USERS') {
    return [userLabel, notification.allBuildings ? null : buildingLabel].filter(Boolean).join(' · ');
  }

  return buildingLabel;
}

/** Tạo nội dung đầy đủ để hiển thị khi người dùng xem chi tiết người nhận. */
function getFullTargetTitle(notification, t) {
  return [
    getCompactTargetLabel(notification, t),
    getBuildingLabel(notification, t),
    notification.targetUserNames?.join(', ')
  ].filter(Boolean).join(' - ');
}

/** Bảng thông báo đã gửi, trình bày người nhận, tòa nhà, nội dung và các thao tác kèm theo. */
export default function NotificationTable({
  notifications,
  onMarkRead,
  processingId,
  showReadStatus = true,
  showTarget = true
}) {
  const { t } = useTranslation();
  const [selectedNotification, setSelectedNotification] = useState(null);
  const closeDetail = () => setSelectedNotification(null);
  const openDetail = (notification) => setSelectedNotification(notification);

  const handleRowKeyDown = (event, notification) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openDetail(notification);
    }
  };

  return (
    <>
      <div className="table-wrap notification-table-wrap">
        <table className="data-table notification-table">
          <thead>
            <tr>
              <th className="notification-title-column">{t('tables.notifications.title')}</th>
              {showTarget && <th className="notification-target-column">{t('tables.common.target')}</th>}
              <th className="notification-date-column">{t('tables.common.created')}</th>
              {showReadStatus && <th className="notification-status-column">{t('tables.notifications.readStatus')}</th>}
              {onMarkRead && <th className="notification-action-column">{t('tables.common.actions')}</th>}
            </tr>
          </thead>
          <tbody>
            {notifications.map((notification) => (
              <tr
                className="notification-clickable-row"
                key={notification.id}
                role="button"
                tabIndex={0}
                onClick={() => openDetail(notification)}
                onKeyDown={(event) => handleRowKeyDown(event, notification)}
              >
                <td className="notification-message-cell">
                  <span className="notification-title-text">{translateInterfaceText(notification.title)}</span>
                </td>
                {showTarget && (
                  <td className="notification-target-cell">
                    <span className="status-pill notification-target-pill">
                      {getCompactTargetLabel(notification, t)}
                    </span>
                    <span
                      className="table-subtext notification-meta-line notification-target-detail"
                      title={getFullTargetTitle(notification, t)}
                    >
                      {getCompactTargetDetail(notification, t)}
                    </span>
                  </td>
                )}
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
                      onClick={(event) => {
                        event.stopPropagation();
                        onMarkRead(notification);
                      }}
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

      <ActionDialog
        className="notification-detail-dialog"
        eyebrow={t('tables.notifications.title')}
        labelledBy="notification-detail-dialog-title"
        open={Boolean(selectedNotification)}
        title={translateInterfaceText(selectedNotification?.title)}
        onClose={closeDetail}
      >
        {selectedNotification && (
          <div className="notification-detail-view">
            <div className="notification-detail-meta">
              {showTarget && (
                <div>
                  <span>{t('tables.common.target')}</span>
                  <strong>{getFullTargetTitle(selectedNotification, t)}</strong>
                </div>
              )}
              <div>
                <span>{t('tables.common.created')}</span>
                <strong>{formatDateTime(selectedNotification.createdAt, t)}</strong>
              </div>
            </div>

            <div className="notification-detail-content">
              <span>{t('tables.common.content')}</span>
              <p>{translateInterfaceText(selectedNotification.content)}</p>
            </div>
          </div>
        )}
      </ActionDialog>
    </>
  );
}
