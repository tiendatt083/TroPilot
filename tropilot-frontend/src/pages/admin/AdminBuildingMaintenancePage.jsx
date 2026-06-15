import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import * as maintenanceApi from '../../features/maintenance/api.js';
import * as adminUserApi from '../../features/users/api.js';
import MaintenanceAssignmentAction from '../../components/MaintenanceAssignmentAction.jsx';
import MaintenanceRequestTable from '../../components/MaintenanceRequestTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';

function activeStaff(users) {
  return users.filter((user) => user.role === 'STAFF' && user.status === 'ACTIVE');
}

export default function AdminBuildingMaintenancePage() {
  const { t } = useTranslation();
  const { building } = useOutletContext();
  const [requests, setRequests] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [assignmentMap, setAssignmentMap] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const buildingFilter = { buildingId: building.id };

  const loadData = async () => {
    setError('');

    try {
      const [requestsResponse, usersResponse] = await Promise.all([
        maintenanceApi.getAdminMaintenanceRequests(buildingFilter),
        adminUserApi.getUsers()
      ]);
      setRequests(requestsResponse.data);
      setStaffUsers(activeStaff(usersResponse.data));
      setAssignmentMap(Object.fromEntries(
        requestsResponse.data.map((request) => [request.id, request.assignedToId || ''])
      ));
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('workspace.maintenance.loadError'));
    }
  };

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [building.id]);

  const handleAssignmentChange = (requestId, assignedToId) => {
    setAssignmentMap((current) => ({
      ...current,
      [requestId]: assignedToId
    }));
  };

  const handleAssign = async (request) => {
    const assignedToId = assignmentMap[request.id];
    if (!assignedToId) {
      setError(t('maintenance.admin.assignedStaffRequired'));
      return;
    }

    setProcessingId(request.id);
    setMessage('');
    setError('');

    try {
      await maintenanceApi.assignAdminMaintenanceRequest(
        request.id,
        { assignedToId: Number(assignedToId) },
        buildingFilter
      );
      setMessage(t('maintenance.admin.assigned'));
      await loadData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('maintenance.admin.assignError'));
    } finally {
      setProcessingId(null);
    }
  };

  const renderActions = (request) => (
    <MaintenanceAssignmentAction
      request={request}
      staffUsers={staffUsers}
      assignedToId={assignmentMap[request.id]}
      processing={processingId === request.id}
      onAssignmentChange={handleAssignmentChange}
      onAssign={handleAssign}
    />
  );

  return (
    <div className="building-workspace">
      <PageHeader eyebrow={t('workspace.maintenance.eyebrow')} title={t('workspace.maintenance.title')} />

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('maintenance.loading')}</div>
      ) : (
        <MaintenanceRequestTable requests={requests} renderActions={renderActions} />
      )}
    </div>
  );
}
