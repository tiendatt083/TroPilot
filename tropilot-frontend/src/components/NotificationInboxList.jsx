import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LineIcon from './common/LineIcon.jsx';
import { formatDateTime } from '../utils/i18nFormat.js';

const EVENT_ICONS = {
  FEEDBACK_CREATED: 'feedback',
  FEEDBACK_UPDATED: 'feedback',
  TASK_ASSIGNED: 'fileText',
  TASK_COMPLETED: 'checkShield',
  TASK_REJECTED: 'fileText',
  EXPENSE_REQUESTED: 'wallet',
  EXPENSE_APPROVED: 'wallet',
  EXPENSE_REJECTED: 'wallet',
  PAYMENT_SUBMITTED: 'wallet',
  PAYMENT_RECEIVED: 'checkShield',
  PAYMENT_REJECTED: 'wallet',
  INVOICE_ISSUED: 'fileText',
  CONTRACT_UPDATED: 'lock',
  MEMBER_REQUESTED: 'userPlus',
  MEMBER_APPROVED: 'userCheck',
  MEMBER_REJECTED: 'users',
  MANUAL: 'bell'
};

export default function NotificationInboxList({
  notifications,
  onMarkRead,
  processingId
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleOpen = async (notification) => {
    if (!notification.read) {
      await onMarkRead(notification, { silent: true });
    }
    if (notification.actionPath) {
      navigate(notification.actionPath);
    }
  };

  if (notifications.length === 0) {
    return <div className="empty-state notification-inbox-empty">{t('tables.notifications.empty')}</div>;
  }

  return (
    <div className="notification-inbox-list">
      {notifications.map((notification) => (
        <article
          className={`notification-inbox-item${notification.read ? '' : ' is-unread'}`}
          key={notification.id}
        >
          <span className="notification-event-icon">
            <LineIcon name={EVENT_ICONS[notification.eventType] || 'bell'} />
          </span>

          <button
            className="notification-inbox-content"
            type="button"
            disabled={processingId === notification.id}
            onClick={() => handleOpen(notification)}
          >
            <span className="notification-inbox-topline">
              <span className="notification-inbox-heading">
                <strong>{notification.title}</strong>
                {!notification.read && <span className="notification-unread-dot" aria-label={t('enum.readStatus.UNREAD')} />}
              </span>
              <span className="notification-inbox-time">{formatDateTime(notification.createdAt, t)}</span>
            </span>
            <span className="notification-inbox-message">{notification.content}</span>
            <span className="notification-inbox-meta">
              <LineIcon name="user" />
              <span>
                {notification.source === 'SYSTEM'
                  ? t('notifications.systemSender')
                  : notification.createdByName}
              </span>
              {notification.actionPath && (
                <span className="notification-open-hint">{t('common.details')}</span>
              )}
            </span>
          </button>

          {!notification.read && (
            <button
              className="notification-read-button"
              type="button"
              title={t('tables.notifications.markRead')}
              aria-label={t('tables.notifications.markRead')}
              disabled={processingId === notification.id}
              onClick={() => onMarkRead(notification)}
            >
              <LineIcon name="checkShield" />
            </button>
          )}
        </article>
      ))}
    </div>
  );
}
