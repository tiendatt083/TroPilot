import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import * as taskApi from '../../features/maintenance/taskApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import TaskTable from '../../components/TaskTable.jsx';

export default function AdminTaskListPage() {
  const { t } = useTranslation();
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

  return (
    <section className="content-section">
      <div className="page-title-row">
        <PageHeader eyebrow={t('role.admin')} title={t('taskManagement.adminTitle')} />
        <Link className="button-link" to="/admin/tasks/create">
          {t('taskManagement.create')}
        </Link>
      </div>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('taskManagement.loading')}</div>
      ) : (
        <TaskTable tasks={tasks} detailBasePath="/admin/tasks" />
      )}
    </section>
  );
}
