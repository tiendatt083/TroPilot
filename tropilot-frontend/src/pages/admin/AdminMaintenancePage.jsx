import { useEffect, useState } from 'react';
import * as maintenanceApi from '../../features/maintenance/api.js';
import * as adminUserApi from '../../features/users/api.js';
import MaintenanceRequestTable from '../../components/MaintenanceRequestTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';

function activeStaff(users) {
  return users.filter((user) => user.role === 'STAFF' && user.status === 'ACTIVE');
}

export default function AdminMaintenancePage() {
  const [requests, setRequests] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [assignmentMap, setAssignmentMap] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const loadData = async () => {
    setError('');

    try {
      const [requestsResponse, usersResponse] = await Promise.all([
        maintenanceApi.getAdminMaintenanceRequests(),
        adminUserApi.getUsers()
      ]);
      setRequests(requestsResponse.data);
      setStaffUsers(activeStaff(usersResponse.data));
      setAssignmentMap(Object.fromEntries(
        requestsResponse.data.map((request) => [request.id, request.assignedToId || ''])
      ));
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Maintenance requests could not be loaded');
    }
  };

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, []);

  const handleAssignmentChange = (requestId, assignedToId) => {
    setAssignmentMap((current) => ({
      ...current,
      [requestId]: assignedToId
    }));
  };

  const handleAssign = async (request) => {
    const assignedToId = assignmentMap[request.id];
    if (!assignedToId) {
      setError('Assigned staff is required');
      return;
    }

    setProcessingId(request.id);
    setMessage('');
    setError('');

    try {
      await maintenanceApi.assignAdminMaintenanceRequest(request.id, {
        assignedToId: Number(assignedToId)
      });
      setMessage('Maintenance request assigned successfully.');
      await loadData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Maintenance request could not be assigned');
    } finally {
      setProcessingId(null);
    }
  };

  const renderActions = (request) => (
    <div className="assignment-action-row">
      <select
        value={assignmentMap[request.id] || ''}
        disabled={request.status === 'COMPLETED' || processingId === request.id}
        onChange={(event) => handleAssignmentChange(request.id, event.target.value)}
      >
        <option value="">Select staff</option>
        {staffUsers.map((staff) => (
          <option key={staff.id} value={staff.id}>
            {staff.fullName}
          </option>
        ))}
      </select>
      <button
        className="secondary-button compact-button"
        type="button"
        disabled={request.status === 'COMPLETED' || processingId === request.id}
        onClick={() => handleAssign(request)}
      >
        Assign
      </button>
    </div>
  );

  return (
    <section className="content-section">
      <PageHeader eyebrow="Administrator" title="Maintenance requests" />

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading maintenance requests...</div>
      ) : (
        <MaintenanceRequestTable requests={requests} renderActions={renderActions} />
      )}
    </section>
  );
}
