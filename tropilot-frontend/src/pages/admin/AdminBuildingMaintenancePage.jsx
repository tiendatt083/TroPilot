import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import * as maintenanceApi from '../../features/maintenance/api.js';
import * as adminUserApi from '../../features/users/api.js';
import ActionDialog from '../../components/common/ActionDialog.jsx';
import FilterBar from '../../components/common/FilterBar.jsx';
import LineIcon from '../../components/common/LineIcon.jsx';
import MaintenanceRequestTable from '../../components/MaintenanceRequestTable.jsx';
import { formatEnumLabel } from '../../utils/i18nFormat.js';
import { MAINTENANCE_STATUS_OPTIONS } from '../../utils/maintenanceOptions.js';
import { normalizeSearchText } from '../../utils/searchText.js';

function activeStaff(users) {
  return users.filter((user) => user.role === 'STAFF' && user.status === 'ACTIVE');
}

function canChangeStaff(status) {
  return status === 'ASSIGNED';
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
  const [assignmentDialog, setAssignmentDialog] = useState({ open: false, request: null });
  const [selectedStaffId, setSelectedStaffId] = useState('');
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
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('workspace.maintenance.loadError'));
    }
  };

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [building.id]);

  const openAssignmentDialog = (request) => {
    setAssignmentDialog({ open: true, request });
    setSelectedStaffId(request.assignedToId ? String(request.assignedToId) : '');
  };

  const closeAssignmentDialog = () => {
    setAssignmentDialog({ open: false, request: null });
    setSelectedStaffId('');
  };

  const handleAssign = async () => {
    if (!assignmentDialog.request || !selectedStaffId) {
      setError(t('maintenance.admin.assignedStaffRequired'));
      return;
    }

    setProcessingId(assignmentDialog.request.id);
    setMessage('');
    setError('');

    try {
      await maintenanceApi.assignAdminMaintenanceRequest(
        assignmentDialog.request.id,
        { assignedToId: Number(selectedStaffId) },
        buildingFilter
      );
      setMessage(t('maintenance.admin.assigned'));
      closeAssignmentDialog();
      await loadData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('maintenance.admin.assignError'));
    } finally {
      setProcessingId(null);
    }
  };

  const renderActions = (request) => {
    const enabled = canChangeStaff(request.status);
    const disabled = !enabled || processingId === request.id;
    const tooltip = request.status === 'PENDING'
      ? t('maintenance.admin.assign')
      : t('maintenance.admin.changeStaff');

    return (
      <button
        aria-label={tooltip}
        className="icon-action-button maintenance-reassign-button"
        data-tooltip={disabled ? undefined : tooltip}
        type="button"
        disabled={disabled}
        onClick={() => openAssignmentDialog(request)}
      >
        <LineIcon name="userCheck" />
      </button>
    );
  };

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
          <ActionDialog
            className="maintenance-assignment-dialog"
            eyebrow={t('maintenance.admin.eyebrow')}
            labelledBy="maintenance-assignment-dialog-title"
            open={assignmentDialog.open}
            title={assignmentDialog.request?.status === 'PENDING'
              ? t('maintenance.admin.assignTitle')
              : t('maintenance.admin.changeStaffTitle')}
            onClose={closeAssignmentDialog}
          >
            <form className="panel-form compact-panel-form" onSubmit={(event) => {
              event.preventDefault();
              handleAssign();
            }}>
              <div className="assignment-dialog-summary">
                <strong>{assignmentDialog.request?.title}</strong>
                <span>{assignmentDialog.request?.equipmentName || assignmentDialog.request?.roomCode || building.name}</span>
              </div>
              <label htmlFor="maintenanceAssignedTo">{t('tables.common.assignedStaff')}</label>
              <select
                id="maintenanceAssignedTo"
                value={selectedStaffId}
                onChange={(event) => setSelectedStaffId(event.target.value)}
                required
              >
                <option value="">{t('maintenance.admin.selectStaff')}</option>
                {staffUsers.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.fullName} - {staff.email}
                  </option>
                ))}
              </select>
              <div className="dialog-actions dialog-actions-right">
                <button className="secondary-button" type="button" onClick={closeAssignmentDialog}>
                  {t('common.cancel')}
                </button>
                <button type="submit" disabled={processingId === assignmentDialog.request?.id}>
                  {processingId === assignmentDialog.request?.id ? t('common.saving') : t('common.saveChanges')}
                </button>
              </div>
            </form>
          </ActionDialog>
        </>
      )}
    </div>
  );
}
