import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import * as taskApi from '../../features/maintenance/taskApi.js';
import * as roomApi from '../../features/rooms/api.js';
import * as adminUserApi from '../../features/users/api.js';
import PageHeader from '../../components/PageHeader.jsx';
import TaskForm from '../../components/TaskForm.jsx';

function activeStaff(users) {
  return users.filter((user) => user.role === 'STAFF' && user.status === 'ACTIVE');
}

export default function AdminTaskCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    Promise.all([adminUserApi.getUsers(), roomApi.getAdminRooms()])
      .then(([usersResponse, roomsResponse]) => {
        if (active) {
          setStaffUsers(activeStaff(usersResponse.data));
          setRooms(roomsResponse.data);
        }
      })
      .catch((apiError) => {
        if (active) {
          setError(apiError.response?.data?.message || t('taskManagement.formLoadError'));
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

  const handleSubmit = async (payload) => {
    setSaving(true);
    setError('');

    try {
      await taskApi.createAdminTask(payload);
      navigate('/admin/tasks', {
        replace: true,
        state: { message: t('taskManagement.created') }
      });
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('taskManagement.createError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="empty-state">{t('taskManagement.loadingForm')}</div>;
  }

  return (
    <section className="content-section narrow-section">
      <div className="page-title-row">
        <PageHeader eyebrow={t('role.admin')} title={t('taskManagement.createTitle')} />
        <Link className="secondary-link" to="/admin/tasks">
          {t('taskManagement.back')}
        </Link>
      </div>

      {error && <div className="alert error-alert">{error}</div>}

      <TaskForm
        rooms={rooms}
        staffUsers={staffUsers}
        loading={saving}
        submitLabel={t('taskManagement.create')}
        onSubmit={handleSubmit}
      />
    </section>
  );
}
