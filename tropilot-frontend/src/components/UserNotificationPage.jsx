import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as notificationApi from '../features/notifications/api.js';
import NotificationInboxList from './NotificationInboxList.jsx';
import NotificationPaginationControls from './NotificationPaginationControls.jsx';
import PageHeader from './PageHeader.jsx';

const HISTORY_PAGE_SIZE = 30;

export default function UserNotificationPage({ eyebrow, eyebrowKey }) {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [notificationPage, setNotificationPage] = useState(0);
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
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('resident.notifications.markReadError'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleNotificationPageChange = (page) => {
    setNotificationPage(page);
  };

  return (
    <section className="content-section notification-page-shell">
      <PageHeader eyebrow={eyebrowKey ? t(eyebrowKey) : eyebrow} title={t('navigation.notifications')} />

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('resident.notifications.loading')}</div>
      ) : (
        <>
          <NotificationInboxList
            notifications={pagedNotifications}
            processingId={processingId}
            onMarkRead={handleMarkRead}
          />
          <NotificationPaginationControls
            page={notificationPage}
            pageSize={HISTORY_PAGE_SIZE}
            totalItems={notifications.length}
            onPageChange={handleNotificationPageChange}
          />
        </>
      )}
    </section>
  );
}
