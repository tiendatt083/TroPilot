import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import * as notificationApi from '../../features/notifications/api.js';
import * as adminUserApi from '../../features/users/api.js';
import CheckboxList from '../../components/CheckboxList.jsx';
import NotificationTable from '../../components/NotificationTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { NOTIFICATION_TARGET_OPTIONS } from '../../utils/notificationOptions.js';

const emptyForm = {
  title: '',
  content: '',
  targetType: 'ALL_RESIDENT_HEADS',
  targetUserIds: []
};

function getResidentHeadDescription(user) {
  const roomLabel = user.assignedRoomCode ? `Room ${user.assignedRoomCode}` : null;
  return [roomLabel, user.email].filter(Boolean).join(' - ');
}

export default function AdminBuildingNotificationPage() {
  const { building } = useOutletContext();
  const [form, setForm] = useState(emptyForm);
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const buildingFilter = { buildingId: building.id };
  const residentHeads = useMemo(
    () => users.filter((user) => user.role === 'RESIDENT_HEAD' && String(user.assignedBuildingId) === String(building.id)),
    [building.id, users]
  );

  const loadData = async () => {
    setError('');

    try {
      const [usersResponse, notificationsResponse] = await Promise.all([
        adminUserApi.getUsers(),
        notificationApi.getAdminNotifications(buildingFilter)
      ]);
      setUsers(usersResponse.data);
      setNotifications(notificationsResponse.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Building notifications could not be loaded');
    }
  };

  useEffect(() => {
    setForm(emptyForm);
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [building.id]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
      targetUserIds: name === 'targetType' ? [] : current.targetUserIds
    }));
  };

  const handleTargetUsersChange = (targetUserIds) => {
    setForm((current) => ({
      ...current,
      targetUserIds
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    const usesBuildingTarget = form.targetType !== 'STAFF';

    if (form.targetType === 'SELECTED_USERS' && form.targetUserIds.length === 0) {
      setError('At least one Head Resident is required');
      return;
    }

    setSaving(true);

    try {
      await notificationApi.createAdminNotification(
        {
          title: form.title,
          content: form.content,
          targetType: form.targetType,
          targetUserIds: form.targetType === 'SELECTED_USERS' ? form.targetUserIds.map(Number) : [],
          buildingTargetType: usesBuildingTarget ? 'SELECTED' : 'ALL',
          buildingIds: usesBuildingTarget ? [building.id] : []
        },
        buildingFilter
      );
      setForm(emptyForm);
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

  const needsSelectedUsers = form.targetType === 'SELECTED_USERS';
  const usesBuildingTarget = form.targetType !== 'STAFF';

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
            {NOTIFICATION_TARGET_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {needsSelectedUsers && (
            <>
              <label>Target Head Residents</label>
              <CheckboxList
                ariaLabel="Target Head Residents"
                items={residentHeads}
                selectedValues={form.targetUserIds}
                onChange={handleTargetUsersChange}
                getValue={(user) => user.id}
                getLabel={(user) => user.fullName}
                getDescription={getResidentHeadDescription}
                emptyMessage="No assigned Head Residents found in this building."
              />
            </>
          )}

          {usesBuildingTarget && (
            <>
              <label htmlFor="targetBuilding">Building receiving notification</label>
              <input id="targetBuilding" value={`${building.buildingCode} - ${building.name}`} disabled readOnly />
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
