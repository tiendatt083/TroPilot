import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import * as taskApi from '../../api/taskApi.js';
import ActionDialog from '../../components/common/ActionDialog.jsx';
import FilterBar from '../../components/common/FilterBar.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import TaskDetail from '../../components/TaskDetail.jsx';
import TaskTable from '../../components/TaskTable.jsx';
import { formatEnumLabel } from '../../utils/i18nFormat.js';
import { normalizeSearchText } from '../../utils/searchText.js';
import { TASK_STATUS_OPTIONS } from '../../utils/taskOptions.js';

function matchesBuilding(task, building) {
  return (
    String(task.buildingId || task.roomBuildingId || '') === String(building.id) ||
    task.buildingCode === building.buildingCode
  );
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
    task.taskType,
    task.status,
    task.deadline
  ];

  return searchableValues.some((value) => normalizeSearchText(value).includes(searchValue));
}

export default function StaffBuildingTaskPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { building } = useOutletContext();
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [completionForm, setCompletionForm] = useState({
    resultNote: '',
    resultImage: null
  });
  const [filters, setFilters] = useState(emptyFilters);
  const filteredTasks = useMemo(() => {
    const searchValue = normalizeSearchText(filters.search);

    return tasks.filter((task) => (
      taskMatchesSearch(task, searchValue)
      && (!filters.status || task.status === filters.status)
    ));
  }, [filters, tasks]);

  const loadTasks = async () => {
    setError('');

    try {
      const response = await taskApi.getStaffTasks();
      const buildingTasks = (response.data || []).filter((task) => matchesBuilding(task, building));
      const targetTaskId = location.state?.taskId ? Number(location.state.taskId) : null;
      const targetTask = targetTaskId
        ? buildingTasks.find((task) => task.id === targetTaskId)
        : null;

      setTasks(buildingTasks);
      if (targetTask) {
        setSelectedTask(targetTask);
        setDetailOpen(true);
        navigate('.', { replace: true, state: null });
      } else if (selectedTask) {
        setSelectedTask(buildingTasks.find((task) => task.id === selectedTask.id) || null);
      }
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('taskManagement.loadError'));
    }
  };

  useEffect(() => {
    setLoading(true);
    loadTasks().finally(() => setLoading(false));
  }, [building.id]);

  const refreshSelectedTask = (task) => {
    setSelectedTask(task);
    setTasks((currentTasks) => currentTasks.map((item) => (item.id === task.id ? task : item)));
  };

  const openTaskDetail = (task) => {
    setSelectedTask(task);
    setDetailOpen(true);
    setMessage('');
    setError('');
  };

  const closeTaskDetail = () => {
    if (!processing) {
      setDetailOpen(false);
    }
  };

  const handleStart = async () => {
    if (!selectedTask) {
      return;
    }

    setProcessing(true);
    setMessage('');
    setError('');

    try {
      const response = await taskApi.startStaffTask(selectedTask.id);
      refreshSelectedTask(response.data);
      setMessage(t('taskManagement.started'));
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('taskManagement.startError'));
    } finally {
      setProcessing(false);
    }
  };

  const handleCompletionChange = (event) => {
    const { name, value, files } = event.target;
    setCompletionForm((current) => ({
      ...current,
      [name]: files ? files[0] || null : value
    }));
  };

  const handleComplete = async (event) => {
    event.preventDefault();

    if (!selectedTask) {
      return;
    }

    setProcessing(true);
    setMessage('');
    setError('');

    try {
      const response = await taskApi.completeStaffTask(selectedTask.id, completionForm);
      refreshSelectedTask(response.data);
      setCompletionForm({ resultNote: '', resultImage: null });
      event.target.reset();
      setMessage(t('taskManagement.completed'));
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('taskManagement.completeError'));
    } finally {
      setProcessing(false);
    }
  };

  const handleClearFilters = () => {
    setFilters(emptyFilters);
  };

  const hasSelectedTaskAction = selectedTask?.status === 'NEW' || selectedTask?.status === 'IN_PROGRESS';

  return (
    <div className="building-workspace">
      <PageHeader eyebrow={t('taskManagement.buildingEyebrow')}/>
      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}
      {loading ? (
        <div className="empty-state">{t('taskManagement.loading')}</div>
      ) : (
        <>
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
          <TaskTable tasks={filteredTasks} onViewTask={openTaskDetail} showAssignedStaff={false} />
        </>
      )}

      <ActionDialog
        className="action-dialog-wide task-staff-dialog task-view-dialog"
        eyebrow={t('taskManagement.actionsEyebrow')}
        labelledBy="staff-building-task-dialog-title"
        open={detailOpen && Boolean(selectedTask)}
        title={selectedTask?.title || t('taskManagement.detailsTitle')}
        onClose={closeTaskDetail}
      >
        {selectedTask && (
          <div className="task-workspace task-staff-workspace">
            <TaskDetail task={selectedTask} />

            {hasSelectedTaskAction && (
              <aside className="task-actions-panel task-staff-actions">
                {selectedTask.status === 'NEW' && (
                  <button className="inline-button" type="button" disabled={processing} onClick={handleStart}>
                    {processing ? t('taskManagement.starting') : t('taskManagement.start')}
                  </button>
                )}

                {selectedTask.status === 'IN_PROGRESS' && (
                  <form className="panel-form task-completion-form" onSubmit={handleComplete}>
                    <div className="task-completion-note-field">
                      <label htmlFor="buildingTaskResultNote">{t('taskManagement.resultNote')}</label>
                      <textarea
                        id="buildingTaskResultNote"
                        name="resultNote"
                        rows="4"
                        value={completionForm.resultNote}
                        onChange={handleCompletionChange}
                        required
                      />
                    </div>

                    <div className="task-completion-side-field">
                      <label htmlFor="buildingTaskResultImage">{t('taskManagement.resultImage')}</label>
                      <input
                        id="buildingTaskResultImage"
                        name="resultImage"
                        type="file"
                        accept="image/jpeg,image/png"
                        onChange={handleCompletionChange}
                      />

                      <button type="submit" disabled={processing}>
                        {processing ? t('taskManagement.completing') : t('taskManagement.complete')}
                      </button>
                    </div>
                  </form>
                )}
              </aside>
            )}
          </div>
        )}
      </ActionDialog>
    </div>
  );
}
