import { useEffect, useState } from 'react';
import * as taskApi from '../../features/maintenance/taskApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import TaskTable from '../../components/TaskTable.jsx';

export default function StaffTaskListPage() {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    taskApi
      .getStaffTasks()
      .then((response) => {
        if (active) {
          setTasks(response.data);
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
  }, []);

  return (
    <section className="content-section">
      <PageHeader eyebrow="Operations staff" title="My tasks" />

      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading tasks...</div>
      ) : (
        <TaskTable tasks={tasks} detailBasePath="/staff/tasks" />
      )}
    </section>
  );
}
