import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as notificationApi from '../features/notifications/api.js';
import ActionDialog from './common/ActionDialog.jsx';
import ManagementPageHero from './common/ManagementPageHero.jsx';
import NotificationInboxList from './NotificationInboxList.jsx';
import NotificationPaginationControls from './NotificationPaginationControls.jsx';
import { formatDateTime } from '../utils/i18nFormat.js';
import { translateInterfaceText } from '../utils/interfaceTranslations.js';

const HISTORY_PAGE_SIZE = 30;

function NotificationDetailDialog({ notification, onClose }) {
  const { t } = useTranslation();

  return (
    <ActionDialog
      className="notification-user-detail-dialog"
      eyebrow={t('resident.notifications.detailEyebrow')}
      labelledBy="user-notification-detail-title"
      open={Boolean(notification)}
      title={notification ? translateInterfaceText(notification.title) : ''}
      onClose={onClose}
    >
      {notification && (
        <div className="user-notification-detail">
          <div className="notification-detail-meta">
            <div>
              <span>{t('resident.notifications.sender')}</span>
              <strong>
                {notification.source === 'SYSTEM'
                  ? t('notifications.systemSender')
                  : notification.createdByName || t('common.notAvailable')}
              </strong>
            </div>
            <div>
              <span>{t('resident.notifications.createdAt')}</span>
              <strong>{formatDateTime(notification.createdAt, t)}</strong>
            </div>
          </div>

          <div className="notification-detail-content">
            <span>{t('resident.notifications.content')}</span>
            <p>{translateInterfaceText(notification.content) || t('common.notAvailable')}</p>
          </div>
        </div>
      )}
    </ActionDialog>
  );
}

export default function UserNotificationPage({ descriptionKey = 'resident.notifications.description' } = {}) {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [notificationPage, setNotificationPage] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const pagedNotifications = useMemo(() => {
    const start = notificationPage * HISTORY_PAGE_SIZE;
    return notifications.slice(start, start + HISTORY_PAGE_SIZE);
  }, [notificationPage, notifications]);

  useEffect(() => {
    notificationApi.getMyNotifications()
      .then((response) => {
        setNotifications(response.data);
        setNotificationPage(0);
      })
      .catch((apiError) => setError(apiError.response?.data?.message || t('resident.notifications.loadError')))
      .finally(() => setLoading(false));
  }, [t]);

  const handleMarkRead = async (notification, options = {}) => {
    setProcessingId(notification.id);
    setMessage('');
    setError('');

    try {
      const response = await notificationApi.markNotificationRead(notification.id);
      setNotifications((current) => current.map((item) => (item.id === notification.id ? response.data : item)));
      if (!options.silent) {
        setMessage(t('resident.notifications.markedRead'));
      }
      return response.data;
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('resident.notifications.markReadError'));
      return notification;
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenNotification = async (notification) => {
    setSelectedNotification(notification);

    if (!notification.read) {
      const updatedNotification = await handleMarkRead(notification, { silent: true });
      setSelectedNotification(updatedNotification);
    }
  };

  const handleNotificationPageChange = (page) => {
    setNotificationPage(page);
  };

  return (
    <section className="content-section notification-page-shell resident-notification-page">
      <ManagementPageHero
        description={t(descriptionKey, { defaultValue: t('resident.notifications.description') })}
        title={t('navigation.notifications')}
      />

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('resident.notifications.loading')}</div>
      ) : (
        <>
          <NotificationInboxList
            notifications={pagedNotifications}
            processingId={processingId}
            onOpenNotification={handleOpenNotification}
          />
          <NotificationPaginationControls
            page={notificationPage}
            pageSize={HISTORY_PAGE_SIZE}
            totalItems={notifications.length}
            onPageChange={handleNotificationPageChange}
          />
          <NotificationDetailDialog
            notification={selectedNotification}
            onClose={() => setSelectedNotification(null)}
          />
        </>
      )}
    </section>
  );
}
