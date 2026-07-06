import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import * as notificationApi from '../../features/notifications/api.js';
import * as adminUserApi from '../../features/users/api.js';
import ActionDialog from '../../components/common/ActionDialog.jsx';
import CheckboxList from '../../components/CheckboxList.jsx';
import NotificationHistoryPanel from '../../components/NotificationHistoryPanel.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { formatEnumLabel } from '../../utils/i18nFormat.js';
import { NOTIFICATION_TARGET_OPTIONS } from '../../utils/notificationOptions.js';

const emptyForm = {
  title: '',
  content: '',
  targetType: 'ALL_RESIDENT_HEADS',
  targetUserIds: []
};

const HISTORY_PAGE_SIZE = 30;

function isBuildingNotificationUser(user, buildingId) {
  if (user.status !== 'ACTIVE') {
    return false;
  }

  if (user.role === 'STAFF') {
    return true;
  }

  return user.role === 'RESIDENT_HEAD' && String(user.assignedBuildingId) === String(buildingId);
}

function getUserRoleLabel(user, t) {
  if (user.role === 'STAFF') {
    return t('role.staff');
  }

  if (user.role === 'RESIDENT_HEAD') {
    return t('role.residentHead');
  }

  return user.role;
}

function getTargetUserDescription(user, t) {
  const roleLabel = getUserRoleLabel(user, t);
  const roomLabel = user.assignedRoomCode ? `${t('tables.common.room')} ${user.assignedRoomCode}` : null;
  return [roleLabel, roomLabel, user.email].filter(Boolean).join(' - ');
}

export default function AdminBuildingNotificationPage() {
  const { t } = useTranslation();
  const { building } = useOutletContext();
  const [form, setForm] = useState(emptyForm);
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notificationPage, setNotificationPage] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);

  const buildingFilter = { buildingId: building.id };
  const selectableUsers = useMemo(
    () => users.filter((user) => isBuildingNotificationUser(user, building.id)),
    [building.id, users]
  );

  const pagedNotifications = useMemo(() => {
    const start = notificationPage * HISTORY_PAGE_SIZE;
    return notifications.slice(start, start + HISTORY_PAGE_SIZE);
  }, [notificationPage, notifications]);

  const loadData = async () => {
    setError('');

    try {
      const [usersResponse, notificationsResponse] = await Promise.all([
        adminUserApi.getUsers(),
        notificationApi.getAdminSentNotifications(buildingFilter)
      ]);
      setUsers(usersResponse.data);
      setNotifications(notificationsResponse.data);
      setNotificationPage(0);
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('workspace.notifications.loadError'));
    }
  };

  useEffect(() => {
    setForm(emptyForm);
    setComposerOpen(false);
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

  const handleNotificationPageChange = (page) => {
    setNotificationPage(page);
  };

  const handleOpenComposer = () => {
    setMessage('');
    setError('');
    setComposerOpen(true);
  };

  const handleCloseComposer = () => {
    if (saving) {
      return;
    }

    setForm(emptyForm);
    setComposerOpen(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    const usesBuildingTarget = form.targetType !== 'STAFF';

    if (form.targetType === 'SELECTED_USERS' && form.targetUserIds.length === 0) {
      setError(t('notifications.atLeastOneUser'));
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
      setComposerOpen(false);
      setMessage(t('notifications.created'));
      await loadData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('notifications.createError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="empty-state">{t('notifications.loading')}</div>;
  }

  const needsSelectedUsers = form.targetType === 'SELECTED_USERS';
  const usesBuildingTarget = form.targetType !== 'STAFF';

  return (
    <div className="building-workspace">
      <PageHeader
        eyebrow={t('workspace.notifications.eyebrow')}
        title={t('workspace.notifications.title')}
        actions={
          !composerOpen && (
            <button className="button-link" type="button" onClick={handleOpenComposer}>
              {t('notifications.actions.create')}
            </button>
          )
        }
      />

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      <ActionDialog
        className="action-dialog-wide"
        eyebrow={t('workspace.notifications.eyebrow')}
        labelledBy="building-notification-create-dialog-title"
        open={composerOpen}
        title={t('notifications.actions.create')}
        onClose={handleCloseComposer}
      >
          <form className="panel-form notification-composer-form" onSubmit={handleSubmit}>
            <div className="notification-field notification-field-full">
              <label htmlFor="title">{t('notifications.fields.title')}</label>
              <input id="title" name="title" value={form.title} onChange={handleChange} maxLength={160} required />
            </div>

            <div className="notification-field notification-field-full">
              <label htmlFor="content">{t('notifications.fields.content')}</label>
              <textarea id="content" name="content" rows="5" value={form.content} onChange={handleChange} required />
            </div>

            <div className="notification-form-grid">
              <div className="notification-field">
                <label htmlFor="targetType">{t('notifications.fields.target')}</label>
                <select id="targetType" name="targetType" value={form.targetType} onChange={handleChange} required>
                  {NOTIFICATION_TARGET_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {formatEnumLabel(t, 'notificationTarget', option.value)}
                    </option>
                  ))}
                </select>
              </div>

              {usesBuildingTarget && (
                <div className="notification-field">
                  <label htmlFor="targetBuilding">{t('notifications.fields.buildingReceiving')}</label>
                  <input id="targetBuilding" value={`${building.buildingCode} - ${building.name}`} disabled readOnly />
                </div>
              )}
            </div>

            {needsSelectedUsers && (
              <div className="notification-field notification-selection-panel">
                <label>{t('notifications.fields.targetUsers')}</label>
                <CheckboxList
                  ariaLabel={t('notifications.fields.targetUsers')}
                  items={selectableUsers}
                  selectedValues={form.targetUserIds}
                  onChange={handleTargetUsersChange}
                  getValue={(user) => user.id}
                  getLabel={(user) => user.fullName}
                  getDescription={(user) => getTargetUserDescription(user, t)}
                  emptyMessage={t('notifications.empty.buildingUsers')}
                />
              </div>
            )}

            <div className="notification-submit-row">
              <button className="secondary-button inline-button" type="button" disabled={saving} onClick={handleCloseComposer}>
                {t('common.cancel')}
              </button>
              <button type="submit" disabled={saving}>
                {saving ? t('notifications.actions.creating') : t('notifications.actions.create')}
              </button>
            </div>
          </form>
      </ActionDialog>

      <NotificationHistoryPanel
        notifications={pagedNotifications}
        page={notificationPage}
        pageSize={HISTORY_PAGE_SIZE}
        totalItems={notifications.length}
        onPageChange={handleNotificationPageChange}
      />
    </div>
  );
}
