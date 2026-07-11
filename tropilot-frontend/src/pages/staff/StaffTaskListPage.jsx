import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as taskApi from '../../features/maintenance/taskApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import TaskTable from '../../components/TaskTable.jsx';

export default function StaffTaskListPage() {
  const { t } = useTranslation();
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
      <PageHeader eyebrow={t('role.staff')} title={t('taskManagement.staffTitle')} />

      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('taskManagement.loading')}</div>
      ) : (
        <TaskTable tasks={tasks} detailBasePath="/staff/tasks" showAssignedStaff={false} />
      )}
    </section>
  );
}
