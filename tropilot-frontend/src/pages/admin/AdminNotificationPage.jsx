import { useEffect, useState } from 'react';
import * as adminUserApi from '../../api/adminUserApi.js';
import * as buildingApi from '../../api/buildingApi.js';
import * as notificationApi from '../../api/notificationApi.js';
import * as roomApi from '../../api/roomApi.js';
import NotificationTable from '../../components/NotificationTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { NOTIFICATION_TARGET_OPTIONS } from '../../utils/notificationOptions.js';

const emptyForm = {
  title: '',
  content: '',
  targetType: 'ALL_RESIDENT_HEADS',
  buildingId: '',
  targetId: ''
};

export default function AdminNotificationPage() {
  const [form, setForm] = useState(emptyForm);
  const [notifications, setNotifications] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadNotifications = async () => {
    const response = await notificationApi.getAdminNotifications();
    setNotifications(response.data);
  };

  useEffect(() => {
    Promise.all([
      roomApi.getAdminRooms(),
      adminUserApi.getUsers(),
      buildingApi.getAdminBuildings(),
      notificationApi.getAdminNotifications()
    ])
      .then(([roomsResponse, usersResponse, buildingsResponse, notificationsResponse]) => {
        setRooms(roomsResponse.data);
        setUsers(usersResponse.data);
        setBuildings(buildingsResponse.data);
        setNotifications(notificationsResponse.data);
      })
      .catch((apiError) => setError(apiError.response?.data?.message || 'Notification form data could not be loaded'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
      buildingId: name === 'targetType' ? '' : current.buildingId,
      targetId: name === 'targetType' ? '' : current.targetId
    }));
  };

  const handleBuildingIdChange = (event) => {
    setForm((current) => ({
      ...current,
      buildingId: event.target.value,
      targetId: ''
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
      const targetId = form.targetType === 'ONE_BUILDING' ? form.buildingId : form.targetId;

      await notificationApi.createAdminNotification({
        title: form.title,
        content: form.content,
        targetType: form.targetType,
        targetId: targetId ? Number(targetId) : null
      });
      setForm(emptyForm);
      setMessage('Notification created successfully.');
      await loadNotifications();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Notification could not be created');
    } finally {
      setSaving(false);
    }
  };

  const needsBuildingTarget = form.targetType === 'ONE_BUILDING';
  const needsRoomTarget = form.targetType === 'ONE_ROOM';
  const needsUserTarget = form.targetType === 'ONE_USER';
  const filteredRooms = needsRoomTarget
    ? rooms.filter((room) => String(room.buildingId) === String(form.buildingId))
    : rooms;

  if (loading) {
    return <div className="empty-state">Loading notification form...</div>;
  }

  return (
    <section className="content-section building-workspace">
      <PageHeader eyebrow="Administrator" title="Notifications" />

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      <div className="narrow-section">
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

          {needsBuildingTarget && (
            <>
              <label htmlFor="targetBuilding">Target building</label>
              <select id="targetBuilding" value={form.buildingId} onChange={handleBuildingIdChange} required>
                <option value="">Select building</option>
                {buildings.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.buildingCode} - {building.name}
                  </option>
                ))}
              </select>
            </>
          )}

          {needsRoomTarget && (
            <>
              <label htmlFor="targetRoomBuilding">Target building</label>
              <select id="targetRoomBuilding" value={form.buildingId} onChange={handleBuildingIdChange} required>
                <option value="">Select building</option>
                {buildings.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.buildingCode} - {building.name}
                  </option>
                ))}
              </select>

              <label htmlFor="targetRoom">Target room</label>
              <select id="targetRoom" value={form.targetId} onChange={handleTargetIdChange} disabled={!form.buildingId} required>
                <option value="">Select room</option>
                {filteredRooms.map((room) => (
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
      </div>

      <section className="building-section">
        <PageHeader eyebrow="Notifications" title="All notifications" />
        <NotificationTable notifications={notifications} />
      </section>
    </section>
  );
}
