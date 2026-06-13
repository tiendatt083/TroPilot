import { useEffect, useState } from 'react';
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
          setError(apiError.response?.data?.message || 'Task could not be loaded');
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
      setMessage('Task updated successfully.');
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Task could not be updated');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="empty-state">Loading task...</div>;
  }

  if (!task) {
    return <div className="empty-state">{error || 'Task not found.'}</div>;
  }

  return (
    <section className="content-section">
      <div className="page-title-row">
        <PageHeader eyebrow="Administrator" title={task.title} />
        <Link className="secondary-link" to="/admin/tasks">
          Back to tasks
        </Link>
      </div>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      <section className="task-workspace">
        <TaskDetail task={task} />
        <div>
          <PageHeader eyebrow="Edit" title="Task details" />
          <TaskForm
            initialValues={task}
            rooms={rooms}
            staffUsers={staffUsers}
            loading={saving}
            submitLabel="Save changes"
            includeStatus
            onSubmit={handleSubmit}
          />
        </div>
      </section>
    </section>
  );
}
