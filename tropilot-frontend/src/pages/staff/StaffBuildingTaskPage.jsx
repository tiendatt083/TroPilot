import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import * as taskApi from '../../features/maintenance/taskApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import TaskTable from '../../components/TaskTable.jsx';

function matchesBuilding(task, building) {
  return (
    String(task.buildingId || task.roomBuildingId || '') === String(building.id) ||
    task.buildingCode === building.buildingCode
  );
}

export default function StaffBuildingTaskPage() {
  const { building } = useOutletContext();
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

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
          setError(apiError.response?.data?.message || 'Tasks could not be loaded');
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

  return (
    <div className="building-workspace">
      <PageHeader eyebrow="Building tasks" title="My tasks in this building" />
      {error && <div className="alert error-alert">{error}</div>}
      {loading ? <div className="empty-state">Loading tasks...</div> : <TaskTable tasks={tasks} detailBasePath="/staff/tasks" />}
    </div>
  );
}
