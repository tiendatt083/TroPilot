import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import * as taskApi from '../../api/taskApi.js';
import * as roomApi from '../../api/roomApi.js';
import * as adminUserApi from '../../api/adminUserApi.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import TaskDetail from '../../components/TaskDetail.jsx';
import TaskForm from '../../components/TaskForm.jsx';

function activeStaff(users) {
  return users.filter((user) => user.role === 'STAFF' && user.status === 'ACTIVE');
}

/** Trang chi tiết công việc vận hành trong phạm vi một tòa nhà. */
export default function AdminBuildingTaskDetailPage() {
  const { t } = useTranslation();
  const { taskId } = useParams();
  const { building } = useOutletContext();
  const [task, setTask] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const buildingFilter = { buildingId: building.id };

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError('');

    Promise.all([
      taskApi.getAdminTask(taskId, buildingFilter),
      adminUserApi.getUsers(),
      roomApi.getAdminRooms(buildingFilter)
    ])
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
  }, [building.id, taskId]);

  const handleSubmit = async (payload) => {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const response = await taskApi.updateAdminTask(taskId, payload, buildingFilter);
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
    <div className="building-workspace">
      <div className="page-title-row">
        <PageHeader eyebrow={t('taskManagement.buildingEyebrow')} title={task.title} />
        <Link className="secondary-link" to={`/admin/buildings/${building.id}/tasks`}>
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
            submitLabel={t('buildingManagement.saveChanges')}
            includeStatus
            roomPlaceholder={t('forms.task.generalBuildingTask')}
            onSubmit={handleSubmit}
          />
        </div>
      </section>
    </div>
  );
}
