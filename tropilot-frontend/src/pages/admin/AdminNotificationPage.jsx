import { useEffect, useMemo, useState } from 'react';
import * as adminUserApi from '../../api/adminUserApi.js';
import * as buildingApi from '../../api/buildingApi.js';
import * as notificationApi from '../../api/notificationApi.js';
import CheckboxList from '../../components/CheckboxList.jsx';
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

function isAssignedResidentHead(user) {
  return user.role === 'RESIDENT_HEAD' && user.assignedBuildingId;
}

function getResidentHeadDescription(user) {
  const roomLabel = user.assignedRoomCode ? `Room ${user.assignedRoomCode}` : null;
  const buildingLabel = user.assignedBuildingCode ? `Building ${user.assignedBuildingCode}` : null;

  return [roomLabel, buildingLabel, user.email].filter(Boolean).join(' - ');
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

  const residentHeads = useMemo(
    () => users.filter(isAssignedResidentHead),
    [users]
  );

  const availableResidentHeads = useMemo(() => {
    if (form.buildingTargetType !== 'SELECTED') {
      return residentHeads;
    }

    if (form.buildingIds.length === 0) {
      return [];
    }

    const selectedBuildingIds = new Set(form.buildingIds.map(String));
    return residentHeads.filter((user) => selectedBuildingIds.has(String(user.assignedBuildingId)));
  }, [form.buildingIds, form.buildingTargetType, residentHeads]);

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

  useEffect(() => {
    if (form.targetType !== 'SELECTED_USERS') {
      return;
    }

    const availableResidentHeadIds = new Set(availableResidentHeads.map((user) => String(user.id)));
    setForm((current) => {
      const nextTargetUserIds = current.targetUserIds.filter((userId) => availableResidentHeadIds.has(String(userId)));
      return nextTargetUserIds.length === current.targetUserIds.length
        ? current
        : { ...current, targetUserIds: nextTargetUserIds };
    });
  }, [availableResidentHeads, form.targetType]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => {
      if (name === 'targetType') {
        const nextForm = {
          ...current,
          targetType: value,
          targetUserIds: []
        };

        return value === 'SELECTED_USERS' && current.buildingTargetType === 'ALL'
          ? { ...nextForm, buildingTargetType: 'SELECTED' }
          : nextForm;
      }

      if (name === 'buildingTargetType') {
        return {
          ...current,
          buildingTargetType: value,
          buildingIds: value === 'ALL' ? [] : current.buildingIds,
          targetUserIds: []
        };
      }

      return {
        ...current,
        [name]: value
      };
    });
  };

  const handleTargetUsersChange = (targetUserIds) => {
    setForm((current) => ({
      ...current,
      targetUserIds
    }));
  };

  const handleBuildingsChange = (buildingIds) => {
    setForm((current) => ({
      ...current,
      buildingIds,
      targetUserIds: current.targetType === 'SELECTED_USERS' ? [] : current.targetUserIds
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (form.buildingTargetType === 'SELECTED' && form.buildingIds.length === 0) {
      setError('At least one target building is required');
      return;
    }

    if (form.targetType === 'SELECTED_USERS' && form.targetUserIds.length === 0) {
      setError('At least one Head Resident is required');
      return;
    }

    setSaving(true);

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
              <label>Building receiving notification</label>
              <CheckboxList
                ariaLabel="Building receiving notification"
                items={buildings}
                selectedValues={form.buildingIds}
                onChange={handleBuildingsChange}
                getValue={(building) => building.id}
                getLabel={(building) => `${building.buildingCode} - ${building.name}`}
                emptyMessage="No buildings found."
              />
            </>
          )}

          {needsSelectedUsers && (
            <>
              <label>Target Head Residents</label>
              <CheckboxList
                ariaLabel="Target Head Residents"
                items={availableResidentHeads}
                selectedValues={form.targetUserIds}
                onChange={handleTargetUsersChange}
                getValue={(user) => user.id}
                getLabel={(user) => user.fullName}
                getDescription={getResidentHeadDescription}
                emptyMessage={
                  needsSelectedBuildings && form.buildingIds.length === 0
                    ? 'Select at least one building to load Head Residents.'
                    : 'No assigned Head Residents found for selected buildings.'
                }
              />
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
