import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import * as taskApi from '../../api/taskApi.js';
import * as roomApi from '../../api/roomApi.js';
import * as adminUserApi from '../../api/adminUserApi.js';
import ActionDialog from '../../components/common/ActionDialog.jsx';
import FilterBar from '../../components/common/FilterBar.jsx';
import TaskForm from '../../components/TaskForm.jsx';
import TaskQuickViewDialog from '../../components/TaskQuickViewDialog.jsx';
import TaskTable from '../../components/TaskTable.jsx';
import { formatEnumLabel } from '../../utils/i18nFormat.js';
import { normalizeSearchText } from '../../utils/searchText.js';
import { TASK_STATUS_OPTIONS } from '../../utils/taskOptions.js';

function activeStaff(users) {
  return users.filter((user) => user.role === 'STAFF' && user.status === 'ACTIVE');
}

const emptyFilters = {
  search: '',
  status: ''
};

function taskMatchesSearch(task, searchValue) {
  if (!searchValue) {
    return true;
  }

  const searchableValues = [
    task.title,
    task.description,
    task.roomCode,
    task.roomName,
    task.buildingCode,
    task.assignedToName,
    task.assignedToEmail,
    task.taskType,
    task.status,
    task.deadline
  ];

  return searchableValues.some((value) => normalizeSearchText(value).includes(searchValue));
}

/** Trang tạo, phân công và theo dõi công việc vận hành của một tòa nhà. */
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
  const [selectedTask, setSelectedTask] = useState(null);
  const [detailMessage, setDetailMessage] = useState('');
  const [detailError, setDetailError] = useState('');
  const [deletingTaskId, setDeletingTaskId] = useState(null);
  const [filters, setFilters] = useState(emptyFilters);

  const buildingFilter = { buildingId: building.id };
  const filteredTasks = useMemo(() => {
    const searchValue = normalizeSearchText(filters.search);

    return tasks.filter((task) => (
      taskMatchesSearch(task, searchValue)
      && (!filters.status || task.status === filters.status)
    ));
  }, [filters, tasks]);

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
      const response = await taskApi.updateAdminTask(selectedTask.id, payload, buildingFilter);
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

  const handleDelete = async (task) => {
    if (['IN_PROGRESS', 'COMPLETED'].includes(task.status)) {
      return;
    }

    if (!window.confirm(t('taskManagement.deleteConfirm', { title: task.title }))) {
      return;
    }

    setDeletingTaskId(task.id);
    setMessage('');
    setError('');

    try {
      await taskApi.deleteAdminTask(task.id, buildingFilter);
      setTasks((currentTasks) => currentTasks.filter((item) => item.id !== task.id));
      setMessage(t('taskManagement.deleted'));
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('taskManagement.deleteError'));
    } finally {
      setDeletingTaskId(null);
    }
  };

  const closeDetail = () => {
    if (!saving) {
      setSelectedTask(null);
      setDetailMessage('');
      setDetailError('');
    }
  };

  const handleClearFilters = () => {
    setFilters(emptyFilters);
  };

  return (
    <div className="building-workspace">
      <div className="building-section-header">
        <span className="page-eyebrow">{t('taskManagement.buildingEyebrow')}</span>
        {!loading && (
          <button className="button-link" type="button" onClick={() => setIsCreating(true)}>
            {t('taskManagement.create')}
          </button>
        )}
      </div>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('taskManagement.loading')}</div>
      ) : (
        <section className="task-workspace task-workspace-list-only">
          <FilterBar
            as="div"
            className="workspace-filter-row"
            searchAriaLabel={t('workspace.filters.searchAria')}
            searchPlaceholder={t('workspace.filters.searchPlaceholder')}
            searchValue={filters.search}
            filters={[
              {
                name: 'status',
                value: filters.status,
                ariaLabel: t('workspace.filters.statusAria'),
                onChange: (value) => setFilters((current) => ({ ...current, status: value })),
                options: [
                  { value: '', label: t('workspace.filters.allStatuses') },
                  ...TASK_STATUS_OPTIONS.map((option) => ({
                    value: option.value,
                    label: formatEnumLabel(t, 'taskStatus', option.value)
                  }))
                ]
              }
            ]}
            clearLabel={t('common.clear')}
            onClear={handleClearFilters}
            onSearchChange={(value) => setFilters((current) => ({ ...current, search: value }))}
          />
          <TaskTable
            tasks={filteredTasks}
            detailBasePath={`/admin/buildings/${building.id}/tasks`}
            deletingTaskId={deletingTaskId}
            onDeleteTask={handleDelete}
            onViewTask={setSelectedTask}
          />
        </section>
      )}

      <ActionDialog
        className="action-dialog-wide task-create-dialog"
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

      <TaskQuickViewDialog
        error={detailError}
        loading={saving}
        message={detailMessage}
        open={Boolean(selectedTask)}
        rooms={rooms}
        roomPlaceholder={t('forms.task.generalBuildingTask')}
        staffUsers={staffUsers}
        task={selectedTask}
        onClose={closeDetail}
        onSubmit={handleUpdate}
      />
    </div>
  );
}
