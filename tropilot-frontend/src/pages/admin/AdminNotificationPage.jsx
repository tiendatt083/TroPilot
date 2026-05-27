import { useEffect, useState } from 'react';
import * as adminUserApi from '../../api/adminUserApi.js';
import * as buildingApi from '../../api/buildingApi.js';
import * as notificationApi from '../../api/notificationApi.js';
import NotificationTable from '../../components/NotificationTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { NOTIFICATION_TARGET_OPTIONS } from '../../utils/notificationOptions.js';

const emptyForm = {
  title: '',
  content: '',
  targetType: 'ALL_RESIDENT_HEADS',
  targetUserIds: [],
  buildingTargetType: 'ALL',
  buildingIds: []
};

function getSelectedValues(selectElement) {
  return Array.from(selectElement.selectedOptions).map((option) => option.value);
}

export default function AdminNotificationPage() {
  const [form, setForm] = useState(emptyForm);
  const [notifications, setNotifications] = useState([]);
  const [buildings, setBuildings] = useState([]);
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
      adminUserApi.getUsers(),
      buildingApi.getAdminBuildings(),
      notificationApi.getAdminNotifications()
    ])
      .then(([usersResponse, buildingsResponse, notificationsResponse]) => {
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
      targetUserIds: name === 'targetType' ? [] : current.targetUserIds,
      buildingIds: name === 'buildingTargetType' && value === 'ALL' ? [] : current.buildingIds
    }));
  };

  const handleTargetUsersChange = (event) => {
    setForm((current) => ({
      ...current,
      targetUserIds: getSelectedValues(event.target)
    }));
  };

  const handleBuildingsChange = (event) => {
    setForm((current) => ({
      ...current,
      buildingIds: getSelectedValues(event.target)
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
        targetUserIds: form.targetType === 'SELECTED_USERS' ? form.targetUserIds.map(Number) : [],
        buildingTargetType: form.buildingTargetType,
        buildingIds: form.buildingTargetType === 'SELECTED' ? form.buildingIds.map(Number) : []
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

  const needsSelectedUsers = form.targetType === 'SELECTED_USERS';
  const needsSelectedBuildings = form.buildingTargetType === 'SELECTED';

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

          {needsSelectedUsers && (
            <>
              <label htmlFor="targetUsers">Target users</label>
              <select
                id="targetUsers"
                value={form.targetUserIds}
                onChange={handleTargetUsersChange}
                multiple
                size={Math.min(Math.max(users.length, 3), 8)}
                required
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.fullName} - {user.email}
                  </option>
                ))}
              </select>
            </>
          )}

          <label htmlFor="buildingTargetType">Target buildings</label>
          <select
            id="buildingTargetType"
            name="buildingTargetType"
            value={form.buildingTargetType}
            onChange={handleChange}
            required
          >
            <option value="ALL">All buildings</option>
            <option value="SELECTED">Selected buildings</option>
          </select>

          {needsSelectedBuildings && (
            <>
              <label htmlFor="targetBuildings">Building receiving notification</label>
              <select
                id="targetBuildings"
                value={form.buildingIds}
                onChange={handleBuildingsChange}
                multiple
                size={Math.min(Math.max(buildings.length, 3), 8)}
                required
              >
                {buildings.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.buildingCode} - {building.name}
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
