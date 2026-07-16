import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import * as taskApi from '../../features/maintenance/taskApi.js';
import FilterBar from '../../components/common/FilterBar.jsx';
import PageHeader from '../../components/PageHeader.jsx';
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
  const { building } = useOutletContext();
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(emptyFilters);
  const filteredTasks = useMemo(() => {
    const searchValue = normalizeSearchText(filters.search);

    return tasks.filter((task) => (
      taskMatchesSearch(task, searchValue)
      && (!filters.status || task.status === filters.status)
    ));
  }, [filters, tasks]);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError('');

    taskApi
      .getStaffTasks()
      .then((response) => {
        if (active) {
          setTasks((response.data || []).filter((task) => matchesBuilding(task, building)));
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
  }, [building]);

  const handleClearFilters = () => {
    setFilters(emptyFilters);
  };

  return (
    <div className="building-workspace">
      <PageHeader eyebrow={t('taskManagement.buildingEyebrow')}/>
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
          <TaskTable tasks={filteredTasks} detailBasePath="/staff/tasks" showAssignedStaff={false} />
        </>
      )}
    </div>
  );
}
