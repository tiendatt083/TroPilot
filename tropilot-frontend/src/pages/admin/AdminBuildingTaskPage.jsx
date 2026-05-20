import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import * as adminUserApi from '../../api/adminUserApi.js';
import * as roomApi from '../../api/roomApi.js';
import * as taskApi from '../../api/taskApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import TaskForm from '../../components/TaskForm.jsx';
import TaskTable from '../../components/TaskTable.jsx';

function activeStaff(users) {
  return users.filter((user) => user.role === 'STAFF' && user.status === 'ACTIVE');
}

export default function AdminBuildingTaskPage() {
  const { building } = useOutletContext();
  const [tasks, setTasks] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formVersion, setFormVersion] = useState(0);

  const buildingFilter = { buildingId: building.id };

  const loadData = async () => {
    setError('');

    try {
      const [tasksResponse, usersResponse, roomsResponse] = await Promise.all([
        taskApi.getAdminTasks(buildingFilter),
        adminUserApi.getUsers(),
        roomApi.getAdminRooms(buildingFilter)
      ]);

      setTasks(tasksResponse.data);
      setStaffUsers(activeStaff(usersResponse.data));
      setRooms(roomsResponse.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Building tasks could not be loaded');
    }
  };

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [building.id]);

  const handleSubmit = async (payload) => {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await taskApi.createAdminTask(payload, buildingFilter);
      setMessage('Task created successfully.');
      setFormVersion((current) => current + 1);
      await loadData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Task could not be created');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="building-workspace">
      <PageHeader eyebrow="Building tasks" title="Tasks in this building" />

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading tasks...</div>
      ) : (
        <section className="task-workspace">
          <div>
            <PageHeader eyebrow="Create" title="Create task for this building" />
            <TaskForm
              key={formVersion}
              rooms={rooms}
              staffUsers={staffUsers}
              loading={saving}
              submitLabel="Create task"
              roomRequired
              roomPlaceholder="Select room"
              onSubmit={handleSubmit}
            />
          </div>
          <TaskTable tasks={tasks} detailBasePath={`/admin/buildings/${building.id}/tasks`} />
        </section>
      )}
    </div>
  );
}
