import { useEffect, useState } from 'react';
import * as adminUserApi from '../../api/adminUserApi.js';
import * as notificationApi from '../../api/notificationApi.js';
import * as roomApi from '../../api/roomApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import { NOTIFICATION_TARGET_OPTIONS } from '../../utils/notificationOptions.js';

const emptyForm = {
  title: '',
  content: '',
  targetType: 'ALL_RESIDENT_HEADS',
  targetId: ''
};

export default function AdminNotificationPage() {
  const [form, setForm] = useState(emptyForm);
  const [rooms, setRooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([roomApi.getAdminRooms(), adminUserApi.getUsers()])
      .then(([roomsResponse, usersResponse]) => {
        setRooms(roomsResponse.data);
        setUsers(usersResponse.data);
      })
      .catch((apiError) => setError(apiError.response?.data?.message || 'Notification form data could not be loaded'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
      targetId: name === 'targetType' ? '' : current.targetId
    }));
  };

  const handleTargetIdChange = (event) => {
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
      await notificationApi.createAdminNotification({
        title: form.title,
        content: form.content,
        targetType: form.targetType,
        targetId: form.targetId ? Number(form.targetId) : null
      });
      setForm(emptyForm);
      setMessage('Notification created successfully.');
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Notification could not be created');
    } finally {
      setSaving(false);
    }
  };

  const needsRoomTarget = form.targetType === 'ONE_ROOM';
  const needsUserTarget = form.targetType === 'ONE_USER';

  if (loading) {
    return <div className="empty-state">Loading notification form...</div>;
  }

  return (
    <section className="content-section narrow-section">
      <PageHeader eyebrow="Administrator" title="Notifications" />

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      <form className="panel-form" onSubmit={handleSubmit}>
        <label htmlFor="title">Title</label>
        <input id="title" name="title" value={form.title} onChange={handleChange} maxLength={160} required />

        <label htmlFor="content">Content</label>
        <textarea id="content" name="content" rows="6" value={form.content} onChange={handleChange} required />

        <label htmlFor="targetType">Target</label>
        <select id="targetType" name="targetType" value={form.targetType} onChange={handleChange} required>
          {NOTIFICATION_TARGET_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {needsRoomTarget && (
          <>
            <label htmlFor="targetRoom">Target room</label>
            <select id="targetRoom" value={form.targetId} onChange={handleTargetIdChange} required>
              <option value="">Select room</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.roomCode} - {room.roomName}
                </option>
              ))}
            </select>
          </>
        )}

        {needsUserTarget && (
          <>
            <label htmlFor="targetUser">Target user</label>
            <select id="targetUser" value={form.targetId} onChange={handleTargetIdChange} required>
              <option value="">Select user</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName} - {user.email}
                </option>
              ))}
            </select>
          </>
        )}

        <button type="submit" disabled={saving}>
          {saving ? 'Creating...' : 'Create notification'}
        </button>
      </form>
    </section>
  );
}
