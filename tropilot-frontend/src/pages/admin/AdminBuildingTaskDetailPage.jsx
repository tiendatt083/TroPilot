import { useEffect, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import * as adminUserApi from '../../api/adminUserApi.js';
import * as roomApi from '../../api/roomApi.js';
import * as taskApi from '../../api/taskApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import TaskDetail from '../../components/TaskDetail.jsx';
import TaskForm from '../../components/TaskForm.jsx';

function activeStaff(users) {
  return users.filter((user) => user.role === 'STAFF' && user.status === 'ACTIVE');
}

export default function AdminBuildingTaskDetailPage() {
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
  }, [building.id, taskId]);

  const handleSubmit = async (payload) => {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const response = await taskApi.updateAdminTask(taskId, payload, buildingFilter);
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
    <div className="building-workspace">
      <div className="page-title-row">
        <PageHeader eyebrow="Building task" title={task.title} />
        <Link className="secondary-link" to={`/admin/buildings/${building.id}/tasks`}>
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
            roomRequired
            roomPlaceholder="Select room"
            onSubmit={handleSubmit}
          />
        </div>
      </section>
    </div>
  );
}
