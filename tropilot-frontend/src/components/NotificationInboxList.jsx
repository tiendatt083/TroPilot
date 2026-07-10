import { useTranslation } from 'react-i18next';
import LineIcon from './common/LineIcon.jsx';
import { formatDateTime } from '../utils/i18nFormat.js';
import { translateInterfaceText } from '../utils/interfaceTranslations.js';

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
  onOpenNotification,
  processingId,
  showReadState = true
}) {
  const { t } = useTranslation();
  const canOpenNotification = typeof onOpenNotification === 'function';

  if (notifications.length === 0) {
    return <div className="empty-state notification-inbox-empty">{t('tables.notifications.empty')}</div>;
  }

  return (
    <div className="notification-inbox-list">
      {notifications.map((notification) => (
        <button
          className={`notification-inbox-item${showReadState ? '' : ' no-read-state'}${showReadState && !notification.read ? ' is-unread' : ''}`}
          key={notification.id}
          type="button"
          disabled={processingId === notification.id}
          onClick={() => canOpenNotification && onOpenNotification(notification)}
        >
          <span className="notification-event-icon">
            <LineIcon name={EVENT_ICONS[notification.eventType] || 'bell'} />
          </span>

          <span className="notification-inbox-content">
            <span className="notification-inbox-topline">
              <span className="notification-inbox-heading">
                <strong>{translateInterfaceText(notification.title)}</strong>
                {showReadState && !notification.read && (
                  <span className="notification-unread-dot" aria-label={t('enum.readStatus.UNREAD')} />
                )}
              </span>
              <span className="notification-inbox-time">{formatDateTime(notification.createdAt, t)}</span>
            </span>
          </span>

          {showReadState && (
            <span
              className={`notification-state-icon ${notification.read ? 'is-read' : 'is-unread'}`}
              title={t(`enum.readStatus.${notification.read ? 'READ' : 'UNREAD'}`)}
              aria-label={t(`enum.readStatus.${notification.read ? 'READ' : 'UNREAD'}`)}
            >
              <LineIcon name={notification.read ? 'checkShield' : 'bell'} />
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
