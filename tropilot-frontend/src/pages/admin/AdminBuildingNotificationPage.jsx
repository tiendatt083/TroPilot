import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import * as notificationApi from '../../api/notificationApi.js';
import * as roomApi from '../../api/roomApi.js';
import NotificationTable from '../../components/NotificationTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';

const emptyForm = {
  title: '',
  content: '',
  targetType: 'ONE_BUILDING',
  targetId: ''
};

const buildingNotificationTargets = [
  { value: 'ONE_BUILDING', label: 'This building' },
  { value: 'ONE_ROOM', label: 'One room in this building' }
];

export default function AdminBuildingNotificationPage() {
  const { building } = useOutletContext();
  const [form, setForm] = useState({ ...emptyForm, targetId: building.id });
  const [rooms, setRooms] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const buildingFilter = { buildingId: building.id };

  const loadData = async () => {
    setError('');

    try {
      const [roomsResponse, notificationsResponse] = await Promise.all([
        roomApi.getAdminRooms(buildingFilter),
        notificationApi.getAdminNotifications(buildingFilter)
      ]);
      setRooms(roomsResponse.data);
      setNotifications(notificationsResponse.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Building notifications could not be loaded');
    }
  };

  useEffect(() => {
    setForm({ ...emptyForm, targetId: building.id });
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [building.id]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
      targetId: name === 'targetType' ? (value === 'ONE_BUILDING' ? building.id : '') : current.targetId
    }));
  };

  const handleTargetRoomChange = (event) => {
    setForm((current) => ({
      ...current,
      targetId: event.target.value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await notificationApi.createAdminNotification(
        {
          title: form.title,
          content: form.content,
          targetType: form.targetType,
          targetId: form.targetType === 'ONE_BUILDING' ? building.id : Number(form.targetId)
        },
        buildingFilter
      );
      setForm({ ...emptyForm, targetId: building.id });
      setMessage('Notification created successfully.');
      await loadData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Notification could not be created');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="empty-state">Loading notifications...</div>;
  }

  return (
    <div className="building-workspace">
      <PageHeader eyebrow="Building notifications" title="Notifications in this building" />

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      <section className="task-workspace">
        <form className="panel-form" onSubmit={handleSubmit}>
          <label htmlFor="title">Title</label>
          <input id="title" name="title" value={form.title} onChange={handleChange} maxLength={160} required />

          <label htmlFor="content">Content</label>
          <textarea id="content" name="content" rows="6" value={form.content} onChange={handleChange} required />

          <label htmlFor="targetType">Target</label>
          <select id="targetType" name="targetType" value={form.targetType} onChange={handleChange} required>
            {buildingNotificationTargets.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {form.targetType === 'ONE_ROOM' && (
            <>
              <label htmlFor="targetRoom">Target room</label>
              <select id="targetRoom" value={form.targetId} onChange={handleTargetRoomChange} required>
                <option value="">Select room</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.roomCode} - {room.roomName}
                  </option>
                ))}
              </select>
            </>
          )}

          <button type="submit" disabled={saving}>
            {saving ? 'Creating...' : 'Create notification'}
          </button>
        </form>

        <NotificationTable notifications={notifications} />
      </section>
    </div>
  );
}
