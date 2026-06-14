import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import * as taskApi from '../../features/maintenance/taskApi.js';
import * as roomApi from '../../features/rooms/api.js';
import * as adminUserApi from '../../features/users/api.js';
import PageHeader from '../../components/PageHeader.jsx';
import TaskDetail from '../../components/TaskDetail.jsx';
import TaskForm from '../../components/TaskForm.jsx';

function activeStaff(users) {
  return users.filter((user) => user.role === 'STAFF' && user.status === 'ACTIVE');
}

export default function AdminTaskDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    Promise.all([taskApi.getAdminTask(id), adminUserApi.getUsers(), roomApi.getAdminRooms()])
      .then(([taskResponse, usersResponse, roomsResponse]) => {
        if (active) {
          setTask(taskResponse.data);
          setStaffUsers(activeStaff(usersResponse.data));
          setRooms(roomsResponse.data);
        }
      })
      .catch((apiError) => {
        if (active) {
          setError(apiError.response?.data?.message || t('taskManagement.loadOneError'));
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
  }, [id]);

  const handleSubmit = async (payload) => {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const response = await taskApi.updateAdminTask(id, payload);
      setTask(response.data);
      setMessage(t('taskManagement.updated'));
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('taskManagement.updateError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="empty-state">{t('taskManagement.loadingOne')}</div>;
  }

  if (!task) {
    return <div className="empty-state">{error || t('taskManagement.notFound')}</div>;
  }

  return (
    <section className="content-section">
      <div className="page-title-row">
        <PageHeader eyebrow={t('role.admin')} title={task.title} />
        <Link className="secondary-link" to="/admin/tasks">
          {t('taskManagement.back')}
        </Link>
      </div>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      <section className="task-workspace">
        <TaskDetail task={task} />
        <div>
          <PageHeader eyebrow={t('taskManagement.editEyebrow')} title={t('taskManagement.detailsTitle')} />
          <TaskForm
            initialValues={task}
            rooms={rooms}
            staffUsers={staffUsers}
            loading={saving}
            submitLabel={t('taskManagement.saveChanges')}
            includeStatus
            onSubmit={handleSubmit}
          />
        </div>
      </section>
    </section>
  );
}
