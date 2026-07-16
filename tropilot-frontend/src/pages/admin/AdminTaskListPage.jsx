import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import * as taskApi from '../../features/maintenance/taskApi.js';
import * as roomApi from '../../features/rooms/api.js';
import * as adminUserApi from '../../features/users/api.js';
import ActionDialog from '../../components/common/ActionDialog.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import TaskForm from '../../components/TaskForm.jsx';
import TaskQuickViewDialog from '../../components/TaskQuickViewDialog.jsx';
import TaskTable from '../../components/TaskTable.jsx';

function activeStaff(users) {
  return users.filter((user) => user.role === 'STAFF' && user.status === 'ACTIVE');
}

export default function AdminTaskListPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const [tasks, setTasks] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [message, setMessage] = useState(location.state?.message || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [formVersion, setFormVersion] = useState(0);
  const [selectedTask, setSelectedTask] = useState(null);
  const [detailMessage, setDetailMessage] = useState('');
  const [detailError, setDetailError] = useState('');

  const loadData = async () => {
    const [tasksResponse, usersResponse, roomsResponse] = await Promise.all([
      taskApi.getAdminTasks(),
      adminUserApi.getUsers(),
      roomApi.getAdminRooms()
    ]);

    setTasks(tasksResponse.data);
    setStaffUsers(activeStaff(usersResponse.data));
    setRooms(roomsResponse.data);
  };

  useEffect(() => {
    let active = true;

    loadData()
      .then(() => {
        if (active) {
          setError('');
        }
      })
      .catch((apiError) => {
        if (active) {
          setError(apiError.response?.data?.message || t('taskManagement.loadError'));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (payload) => {
    setSaving(true);
    setFormError('');
    setMessage('');
    setError('');

    try {
      await taskApi.createAdminTask(payload);
      setMessage(t('taskManagement.created'));
      setFormOpen(false);
      setFormVersion((current) => current + 1);
      await loadData();
    } catch (apiError) {
      setFormError(apiError.response?.data?.message || t('taskManagement.createError'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (payload) => {
    if (!selectedTask) {
      return false;
    }

    setSaving(true);
    setDetailMessage('');
    setDetailError('');
    setMessage('');
    setError('');

    try {
      const response = await taskApi.updateAdminTask(selectedTask.id, payload);
      const updatedTask = response.data;
      setSelectedTask(updatedTask);
      setTasks((currentTasks) => currentTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)));
      setDetailMessage(t('taskManagement.updated'));
      return true;
    } catch (apiError) {
      setDetailError(apiError.response?.data?.message || t('taskManagement.updateError'));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const closeDetail = () => {
    if (!saving) {
      setSelectedTask(null);
      setDetailMessage('');
      setDetailError('');
    }
  };

  return (
    <section className="content-section">
      <div className="page-title-row">
        <PageHeader eyebrow={t('role.admin')} title={t('taskManagement.adminTitle')} />
        <button className="button-link" type="button" onClick={() => setFormOpen(true)}>
          {t('taskManagement.create')}
        </button>
      </div>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('taskManagement.loading')}</div>
      ) : (
        <TaskTable tasks={tasks} detailBasePath="/admin/tasks" onViewTask={setSelectedTask} />
      )}

      <ActionDialog
        className="action-dialog-wide"
        eyebrow={t('role.admin')}
        labelledBy="admin-task-create-dialog-title"
        open={formOpen}
        title={t('taskManagement.createTitle')}
        onClose={() => {
          if (!saving) {
            setFormOpen(false);
            setFormError('');
          }
        }}
      >
        {formError && <div className="alert error-alert">{formError}</div>}
        <TaskForm
          key={formVersion}
          rooms={rooms}
          staffUsers={staffUsers}
          loading={saving}
          submitLabel={t('taskManagement.create')}
          roomPlaceholder={t('forms.task.noRoomLinked')}
          onSubmit={handleSubmit}
        />
      </ActionDialog>

      <TaskQuickViewDialog
        error={detailError}
        loading={saving}
        message={detailMessage}
        open={Boolean(selectedTask)}
        rooms={rooms}
        roomPlaceholder={t('forms.task.noRoomLinked')}
        staffUsers={staffUsers}
        task={selectedTask}
        onClose={closeDetail}
        onSubmit={handleUpdate}
      />
    </section>
  );
}
