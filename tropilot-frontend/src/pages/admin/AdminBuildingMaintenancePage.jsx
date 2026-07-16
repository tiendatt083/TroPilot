import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import * as maintenanceApi from '../../features/maintenance/api.js';
import * as adminUserApi from '../../features/users/api.js';
import FilterBar from '../../components/common/FilterBar.jsx';
import MaintenanceAssignmentAction from '../../components/MaintenanceAssignmentAction.jsx';
import MaintenanceRequestTable from '../../components/MaintenanceRequestTable.jsx';
import { formatEnumLabel } from '../../utils/i18nFormat.js';
import { MAINTENANCE_STATUS_OPTIONS } from '../../utils/maintenanceOptions.js';
import { normalizeSearchText } from '../../utils/searchText.js';

function activeStaff(users) {
  return users.filter((user) => user.role === 'STAFF' && user.status === 'ACTIVE');
}

const emptyFilters = {
  search: '',
  status: ''
};

function requestMatchesSearch(request, searchValue) {
  if (!searchValue) {
    return true;
  }

  const searchableValues = [
    request.title,
    request.content,
    request.roomCode,
    request.roomName,
    request.requestedByName,
    request.residentHeadName,
    request.assignedToName,
    request.equipmentCode,
    request.equipmentName,
    request.status
  ];

  return searchableValues.some((value) => normalizeSearchText(value).includes(searchValue));
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
  const [filters, setFilters] = useState(emptyFilters);

  const buildingFilter = { buildingId: building.id };
  const filteredRequests = useMemo(() => {
    const searchValue = normalizeSearchText(filters.search);

    return requests.filter((request) => (
      requestMatchesSearch(request, searchValue)
      && (!filters.status || request.status === filters.status)
    ));
  }, [filters, requests]);

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

  const handleClearFilters = () => {
    setFilters(emptyFilters);
  };

  return (
    <div className="building-workspace">
      <div className="building-section-header">
        <span className="page-eyebrow">{t('workspace.maintenance.eyebrow')}</span>
      </div>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('maintenance.loading')}</div>
      ) : (
        <>
          <FilterBar
            as="div"
            className="workspace-filter-row"
            searchAriaLabel={t('workspace.filters.searchAria')}
            searchPlaceholder={t('workspace.filters.searchPlaceholder')}
            searchValue={filters.search}
            filters={[
              {
                name: 'status',
                value: filters.status,
                ariaLabel: t('workspace.filters.statusAria'),
                onChange: (value) => setFilters((current) => ({ ...current, status: value })),
                options: [
                  { value: '', label: t('workspace.filters.allStatuses') },
                  ...MAINTENANCE_STATUS_OPTIONS.map((option) => ({
                    value: option.value,
                    label: formatEnumLabel(t, 'maintenanceStatus', option.value)
                  }))
                ]
              }
            ]}
            clearLabel={t('common.clear')}
            onClear={handleClearFilters}
            onSearchChange={(value) => setFilters((current) => ({ ...current, search: value }))}
          />
          <MaintenanceRequestTable requests={filteredRequests} renderActions={renderActions} />
        </>
      )}
    </div>
  );
}
