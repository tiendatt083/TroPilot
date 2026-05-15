import { useEffect, useState } from 'react';
import * as notificationApi from '../../api/notificationApi.js';
import NotificationTable from '../../components/NotificationTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';

export default function ResidentNotificationPage() {
  const [notifications, setNotifications] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const loadNotifications = async () => {
    setError('');
    const response = await notificationApi.getResidentNotifications();
    setNotifications(response.data);
  };

  useEffect(() => {
    loadNotifications()
      .catch((apiError) => setError(apiError.response?.data?.message || 'Notifications could not be loaded'))
      .finally(() => setLoading(false));
  }, []);

  const handleMarkRead = async (notification) => {
    setProcessingId(notification.id);
    setMessage('');
    setError('');

    try {
      const response = await notificationApi.markNotificationRead(notification.id);
      setNotifications((current) => current.map((item) => (item.id === notification.id ? response.data : item)));
      setMessage('Notification marked as read.');
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Notification could not be marked as read');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <section className="content-section">
      <PageHeader eyebrow="Head resident" title="Notifications" />

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading notifications...</div>
      ) : (
        <NotificationTable
          notifications={notifications}
          processingId={processingId}
          onMarkRead={handleMarkRead}
        />
      )}
    </section>
  );
}
