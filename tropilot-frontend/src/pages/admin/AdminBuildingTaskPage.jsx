import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import * as taskApi from '../../features/maintenance/taskApi.js';
import * as roomApi from '../../features/rooms/api.js';
import * as adminUserApi from '../../features/users/api.js';
import ActionDialog from '../../components/common/ActionDialog.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import TaskForm from '../../components/TaskForm.jsx';
import TaskTable from '../../components/TaskTable.jsx';

function activeStaff(users) {
  return users.filter((user) => user.role === 'STAFF' && user.status === 'ACTIVE');
}

export default function AdminBuildingTaskPage() {
  const { t } = useTranslation();
  const { building } = useOutletContext();
  const [tasks, setTasks] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formVersion, setFormVersion] = useState(0);
  const [isCreating, setIsCreating] = useState(false);

  const buildingFilter = { buildingId: building.id };

  const loadData = async () => {
    setError('');

    try {
      const [tasksResponse, usersResponse, roomsResponse] = await Promise.all([
        taskApi.getAdminTasks(buildingFilter),
        adminUserApi.getUsers(),
        roomApi.getAdminRooms(buildingFilter)
      ]);

      setTasks(tasksResponse.data);
      setStaffUsers(activeStaff(usersResponse.data));
      setRooms(roomsResponse.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('taskManagement.buildingLoadError'));
    }
  };

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [building.id]);

  const handleSubmit = async (payload) => {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await taskApi.createAdminTask(payload, buildingFilter);
      setMessage(t('taskManagement.created'));
      setFormVersion((current) => current + 1);
      setIsCreating(false);
      await loadData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('taskManagement.createError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="building-workspace">
      <PageHeader
        eyebrow={t('taskManagement.buildingEyebrow')}
        title={t('taskManagement.buildingTitle')}
        actions={
          !loading ? (
            <button className="button-link" type="button" onClick={() => setIsCreating(true)}>
              {t('taskManagement.create')}
            </button>
          ) : null
        }
      />

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('taskManagement.loading')}</div>
      ) : (
        <section className="task-workspace task-workspace-list-only">
          <TaskTable tasks={tasks} detailBasePath={`/admin/buildings/${building.id}/tasks`} />
        </section>
      )}

      <ActionDialog
        className="action-dialog-wide"
        eyebrow={t('taskManagement.create')}
        labelledBy="task-create-dialog-title"
        open={isCreating}
        title={t('taskManagement.createForBuilding')}
        onClose={() => {
          if (!saving) {
            setIsCreating(false);
          }
        }}
      >
        <TaskForm
          key={formVersion}
          rooms={rooms}
          staffUsers={staffUsers}
          loading={saving}
          submitLabel={t('taskManagement.create')}
          roomPlaceholder={t('forms.task.generalBuildingTask')}
          onSubmit={handleSubmit}
        />
      </ActionDialog>
    </div>
  );
}
