import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as adminUserApi from '../../api/adminUserApi.js';
import * as roomApi from '../../api/roomApi.js';
import * as taskApi from '../../api/taskApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import TaskForm from '../../components/TaskForm.jsx';

function activeStaff(users) {
  return users.filter((user) => user.role === 'STAFF' && user.status === 'ACTIVE');
}

export default function AdminTaskCreatePage() {
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
          setError(apiError.response?.data?.message || 'Task form data could not be loaded');
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
        state: { message: 'Task created successfully.' }
      });
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Task could not be created');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="empty-state">Loading task form...</div>;
  }

  return (
    <section className="content-section narrow-section">
      <div className="page-title-row">
        <PageHeader eyebrow="Administrator" title="Create task" />
        <Link className="secondary-link" to="/admin/tasks">
          Back to tasks
        </Link>
      </div>

      {error && <div className="alert error-alert">{error}</div>}

      <TaskForm
        rooms={rooms}
        staffUsers={staffUsers}
        loading={saving}
        submitLabel="Create task"
        onSubmit={handleSubmit}
      />
    </section>
  );
}
