import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import * as taskApi from '../../api/taskApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import TaskTable from '../../components/TaskTable.jsx';

export default function AdminTaskListPage() {
  const location = useLocation();
  const [tasks, setTasks] = useState([]);
  const [message, setMessage] = useState(location.state?.message || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    taskApi
      .getAdminTasks()
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
      <div className="page-title-row">
        <PageHeader eyebrow="Administrator" title="Staff tasks" />
        <Link className="button-link" to="/admin/tasks/create">
          Create task
        </Link>
      </div>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading tasks...</div>
      ) : (
        <TaskTable tasks={tasks} detailBasePath="/admin/tasks" />
      )}
    </section>
  );
}
