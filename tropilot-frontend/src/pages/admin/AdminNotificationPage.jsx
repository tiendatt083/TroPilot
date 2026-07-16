import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as buildingApi from '../../features/buildings/api.js';
import * as notificationApi from '../../features/notifications/api.js';
import * as adminUserApi from '../../features/users/api.js';
import ActionDialog from '../../components/common/ActionDialog.jsx';
import ManagementPageHero from '../../components/common/ManagementPageHero.jsx';
import CheckboxList from '../../components/CheckboxList.jsx';
import NotificationHistoryPanel from '../../components/NotificationHistoryPanel.jsx';
import { formatEnumLabel } from '../../utils/i18nFormat.js';
import { NOTIFICATION_TARGET_OPTIONS } from '../../utils/notificationOptions.js';

const emptyForm = {
  title: '',
  content: '',
  targetType: 'ALL_RESIDENT_HEADS',
  targetUserIds: [],
  buildingTargetType: 'ALL',
  buildingIds: []
};

const HISTORY_PAGE_SIZE = 30;

function isSelectableNotificationUser(user) {
  return user.status === 'ACTIVE' && (user.role === 'STAFF' || (user.role === 'RESIDENT_HEAD' && user.assignedBuildingId));
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
  const buildingLabel = user.assignedBuildingCode ? `${t('tables.common.building')} ${user.assignedBuildingCode}` : null;

  return [roleLabel, roomLabel, buildingLabel, user.email].filter(Boolean).join(' - ');
}

export default function AdminNotificationPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState(emptyForm);
  const [notifications, setNotifications] = useState([]);
  const [notificationPage, setNotificationPage] = useState(0);
  const [buildings, setBuildings] = useState([]);
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);

  const selectableUsers = useMemo(
    () => users.filter(isSelectableNotificationUser),
    [users]
  );

  const availableTargetUsers = useMemo(() => {
    if (form.buildingTargetType !== 'SELECTED') {
      return selectableUsers;
    }

    if (form.buildingIds.length === 0) {
      return [];
    }

    const selectedBuildingIds = new Set(form.buildingIds.map(String));
    return selectableUsers.filter((user) => (
      user.role === 'STAFF' || selectedBuildingIds.has(String(user.assignedBuildingId))
    ));
  }, [form.buildingIds, form.buildingTargetType, selectableUsers]);

  const pagedNotifications = useMemo(() => {
    const start = notificationPage * HISTORY_PAGE_SIZE;
    return notifications.slice(start, start + HISTORY_PAGE_SIZE);
  }, [notificationPage, notifications]);

  const loadNotifications = async () => {
    try {
      const response = await notificationApi.getAdminSentNotifications();
      setNotifications(response.data);
      setNotificationPage(0);
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('notifications.loadError'));
    }
  };

  useEffect(() => {
    Promise.all([
      adminUserApi.getUsers(),
      buildingApi.getAdminBuildings(),
      notificationApi.getAdminSentNotifications()
    ])
      .then(([usersResponse, buildingsResponse, notificationsResponse]) => {
        setUsers(usersResponse.data);
        setBuildings(buildingsResponse.data);
        setNotifications(notificationsResponse.data);
      })
      .catch((apiError) => setError(apiError.response?.data?.message || t('notifications.formLoadError')))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (form.targetType !== 'SELECTED_USERS') {
      return;
    }

    const availableTargetUserIds = new Set(availableTargetUsers.map((user) => String(user.id)));
    setForm((current) => {
      const nextTargetUserIds = current.targetUserIds.filter((userId) => availableTargetUserIds.has(String(userId)));
      return nextTargetUserIds.length === current.targetUserIds.length
        ? current
        : { ...current, targetUserIds: nextTargetUserIds };
    });
  }, [availableTargetUsers, form.targetType]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => {
      if (name === 'targetType') {
        const nextForm = {
          ...current,
          targetType: value,
          targetUserIds: []
        };

        if (value === 'STAFF') {
          return {
            ...nextForm,
            buildingTargetType: 'ALL',
            buildingIds: []
          };
        }

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

    if (usesBuildingTarget && form.buildingTargetType === 'SELECTED' && form.buildingIds.length === 0) {
      setError(t('notifications.atLeastOneBuilding'));
      return;
    }

    if (form.targetType === 'SELECTED_USERS' && form.targetUserIds.length === 0) {
      setError(t('notifications.atLeastOneUser'));
      return;
    }

    setSaving(true);

    try {
      await notificationApi.createAdminNotification({
        title: form.title,
        content: form.content,
        targetType: form.targetType,
        targetUserIds: form.targetType === 'SELECTED_USERS' ? form.targetUserIds.map(Number) : [],
        buildingTargetType: usesBuildingTarget ? form.buildingTargetType : 'ALL',
        buildingIds: usesBuildingTarget && form.buildingTargetType === 'SELECTED' ? form.buildingIds.map(Number) : []
      });
      setForm(emptyForm);
      setComposerOpen(false);
      setMessage(t('notifications.created'));
      await loadNotifications();
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('notifications.createError'));
    } finally {
      setSaving(false);
    }
  };

  const needsSelectedUsers = form.targetType === 'SELECTED_USERS';
  const usesBuildingTarget = form.targetType !== 'STAFF';
  const needsSelectedBuildings = usesBuildingTarget && form.buildingTargetType === 'SELECTED';

  if (loading) {
    return <div className="empty-state">{t('notifications.formLoading')}</div>;
  }

  return (
    <section className="content-section management-page">
      <ManagementPageHero
        title={t('notifications.title')}
        description={t('notifications.summary', { count: notifications.length })}
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
        className="action-dialog-wide notification-create-dialog"
        eyebrow={t('notifications.adminEyebrow')}
        labelledBy="admin-notification-create-dialog-title"
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
              <textarea id="content" name="content" rows="6" value={form.content} onChange={handleChange} required />
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
                  <label htmlFor="buildingTargetType">{t('notifications.fields.targetBuildings')}</label>
                  <select
                    id="buildingTargetType"
                    name="buildingTargetType"
                    value={form.buildingTargetType}
                    onChange={handleChange}
                    required
                  >
                    <option value="ALL">{t('notifications.buildingTarget.all')}</option>
                    <option value="SELECTED">{t('notifications.buildingTarget.selected')}</option>
                  </select>
                </div>
              )}
            </div>

            {needsSelectedBuildings && (
              <div className="notification-field notification-selection-panel">
                <label>{t('notifications.fields.buildingReceiving')}</label>
                <CheckboxList
                  ariaLabel={t('notifications.fields.buildingReceiving')}
                  items={buildings}
                  selectedValues={form.buildingIds}
                  onChange={handleBuildingsChange}
                  getValue={(building) => building.id}
                  getLabel={(building) => `${building.buildingCode} - ${building.name}`}
                  emptyMessage={t('notifications.empty.buildings')}
                />
              </div>
            )}

            {needsSelectedUsers && (
              <div className="notification-field notification-selection-panel">
                <label>{t('notifications.fields.targetUsers')}</label>
                <CheckboxList
                  ariaLabel={t('notifications.fields.targetUsers')}
                  items={availableTargetUsers}
                  selectedValues={form.targetUserIds}
                  onChange={handleTargetUsersChange}
                  getValue={(user) => user.id}
                  getLabel={(user) => user.fullName}
                  getDescription={(user) => getTargetUserDescription(user, t)}
                  emptyMessage={
                    needsSelectedBuildings && form.buildingIds.length === 0
                      ? t('notifications.empty.selectBuildingFirst')
                      : t('notifications.empty.users')
                  }
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
    </section>
  );
}
