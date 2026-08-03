import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import * as maintenanceApi from '../../api/maintenanceApi.js';
import ActionDialog from '../../components/common/ActionDialog.jsx';
import FilterBar from '../../components/common/FilterBar.jsx';
import LineIcon from '../../components/common/LineIcon.jsx';
import MaintenanceRequestDetail from '../../components/MaintenanceRequestDetail.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import { formatDateTime, formatEnumLabel } from '../../utils/i18nFormat.js';
import { getMaintenanceStatusClass, MAINTENANCE_STATUS_OPTIONS } from '../../utils/maintenanceOptions.js';
import { formatRoomCode } from '../../utils/roomDisplay.js';
import { normalizeSearchText } from '../../utils/searchText.js';

const emptyFilters = {
  search: '',
  status: ''
};

const STAFF_OVERVIEW_VISIBLE_STATUSES = new Set(['ASSIGNED', 'IN_PROGRESS']);

function requestMatchesSearch(request, searchValue) {
  if (!searchValue) {
    return true;
  }

  const searchableValues = [
    request.title,
    request.content,
    request.roomCode,
    request.roomName,
    request.buildingCode,
    request.buildingName,
    request.requestedByName,
    request.residentHeadName,
    request.equipmentCode,
    request.equipmentName,
    request.status,
    request.createdAt
  ];

  return searchableValues.some((value) => normalizeSearchText(value).includes(searchValue));
}

function getMaintenanceDeviceText(request, t) {
  return request.equipmentName
    || request.equipmentCode
    || request.title
    || t('common.notProvided');
}

function getMaintenanceDeviceSubtext(request, t) {
  if (request.equipmentCode && request.equipmentName && request.equipmentCode !== request.equipmentName) {
    return request.equipmentCode;
  }

  if (request.content && request.content !== request.title) {
    return request.content;
  }

  return request.equipmentId ? t('navigation.equipment') : t('tables.common.request');
}

function getMaintenanceRoomText(request, t) {
  return request.roomId ? formatRoomCode(request) : t('equipment.scopes.BUILDING');
}

/** Trang xử lý các yêu cầu bảo trì được giao cho nhân viên. */
export default function StaffMaintenancePage() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const outletContext = useOutletContext();
  const building = outletContext?.building;
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [filters, setFilters] = useState(emptyFilters);
  const [completionForm, setCompletionForm] = useState({
    resultNote: '',
    resultImage: null
  });
  const filteredRequests = useMemo(() => {
    const visibleRequests = building
      ? requests
      : requests.filter((request) => STAFF_OVERVIEW_VISIBLE_STATUSES.has(request.status));

    if (!building) {
      return visibleRequests;
    }

    const searchValue = normalizeSearchText(filters.search);

    return visibleRequests.filter((request) => (
      requestMatchesSearch(request, searchValue)
      && (!filters.status || request.status === filters.status)
    ));
  }, [building, filters, requests]);

  const loadRequests = async () => {
    setError('');

    try {
      const response = await maintenanceApi.getStaffMaintenanceRequests(building?.id ? { buildingId: building.id } : undefined);
      const targetRequestId = building && location.state?.maintenanceRequestId
        ? Number(location.state.maintenanceRequestId)
        : null;
      const targetRequest = targetRequestId
        ? response.data.find((request) => request.id === targetRequestId)
        : null;

      setRequests(response.data);
      setSelectedRequest((current) => targetRequest || (
        current
          ? response.data.find((request) => request.id === current.id) || response.data[0] || null
          : response.data[0] || null
      ));
      if (targetRequest) {
        setDetailOpen(true);
        navigate('.', { replace: true, state: null });
      }
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('maintenance.loadError'));
    }
  };

  useEffect(() => {
    loadRequests().finally(() => setLoading(false));
  }, [building?.id]);

  const refreshSelectedRequest = (request) => {
    setSelectedRequest(request);
    setRequests((current) => current.map((item) => (item.id === request.id ? request : item)));
  };

  const handleStart = async () => {
    setProcessing(true);
    setMessage('');
    setError('');

    try {
      const response = await maintenanceApi.startStaffMaintenanceRequest(selectedRequest.id);
      refreshSelectedRequest(response.data);
      setMessage(t('maintenance.staff.started'));
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('maintenance.staff.startError'));
    } finally {
      setProcessing(false);
    }
  };

  const handleCompletionChange = (event) => {
    const { name, value, files } = event.target;
    setCompletionForm((current) => ({
      ...current,
      [name]: files ? files[0] || null : value
    }));
  };

  const handleComplete = async (event) => {
    event.preventDefault();
    setProcessing(true);
    setMessage('');
    setError('');

    try {
      const response = await maintenanceApi.completeStaffMaintenanceRequest(selectedRequest.id, completionForm);
      refreshSelectedRequest(response.data);
      setCompletionForm({ resultNote: '', resultImage: null });
      event.target.reset();
      setMessage(t('maintenance.staff.completed'));
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('maintenance.staff.completeError'));
    } finally {
      setProcessing(false);
    }
  };

  const canStart = selectedRequest?.status === 'ASSIGNED';
  const canComplete = selectedRequest?.status === 'IN_PROGRESS';
  const hasSelectedMaintenanceAction = canStart || canComplete;

  const openRequestDetail = (request) => {
    if (!building && request.buildingId) {
      navigate(`/staff/buildings/${request.buildingId}/maintenance`, {
        state: { maintenanceRequestId: request.id }
      });
      return;
    }

    setSelectedRequest(request);
    setDetailOpen(true);
  };

  const closeRequestDetail = () => {
    if (processing) {
      return;
    }

    setDetailOpen(false);
  };

  const handleClearFilters = () => {
    setFilters(emptyFilters);
  };

  return (
    <section
      className={`${building ? 'building-workspace staff-building-maintenance-page' : 'content-section staff-maintenance-overview-page'} staff-maintenance-page`}
    >
      {building ? (
        <div className="building-section-header">
          <span className="page-eyebrow">{t('maintenance.staff.buildingEyebrow')}</span>
        </div>
      ) : (
        <PageHeader
          eyebrow={t('maintenance.staff.eyebrow')}
          title={t('maintenance.title')}
        />
      )}

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('maintenance.loading')}</div>
      ) : (
        <>
          {building && (
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
          )}
          <div className="table-wrap staff-maintenance-table-wrap">
            <table className="data-table staff-maintenance-request-table">
              <thead>
                <tr>
                  <th>{t('navigation.equipment')}</th>
                  <th>{t('tables.common.room')}</th>
                  <th>{t('tables.common.requestedBy')}</th>
                  <th>{t('tables.common.created')}</th>
                  <th>{t('tables.common.status')}</th>
                  <th className="staff-maintenance-actions-column">{t('tables.common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr key={request.id}>
                    <td>
                      <span className="staff-maintenance-main-text">{getMaintenanceDeviceText(request, t)}</span>
                      <span className="table-subtext">{getMaintenanceDeviceSubtext(request, t)}</span>
                    </td>
                    <td>{getMaintenanceRoomText(request, t)}</td>
                    <td>{request.requestedByName || request.residentHeadName || t('common.notProvided')}</td>
                    <td>{formatDateTime(request.createdAt, t)}</td>
                    <td>
                      <span className={getMaintenanceStatusClass(request.status)}>
                        {formatEnumLabel(t, 'maintenanceStatus', request.status)}
                      </span>
                    </td>
                    <td className="staff-maintenance-actions-cell">
                      <button
                        aria-label={t('common.view')}
                        className="icon-action-button"
                        data-tooltip={t('common.view')}
                        type="button"
                        onClick={() => openRequestDetail(request)}
                      >
                        <LineIcon name="eye" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredRequests.length === 0 && (
              <div className="empty-state flat-empty-state">{t('tables.maintenanceRequests.empty')}</div>
            )}
          </div>
        </>
      )}

      <ActionDialog
        className="maintenance-staff-dialog action-dialog-wide"
        eyebrow={t('maintenance.staff.actions')}
        labelledBy="staff-maintenance-dialog-title"
        open={detailOpen && Boolean(selectedRequest)}
        title={selectedRequest?.title || t('maintenance.title')}
        onClose={closeRequestDetail}
      >
        <div className="maintenance-staff-dialog-grid">
          <MaintenanceRequestDetail request={selectedRequest} />

          {selectedRequest && hasSelectedMaintenanceAction && (
            <div className="task-actions-panel maintenance-staff-action-panel">
              {canStart && (
                <button
                  className="inline-button maintenance-start-button"
                  type="button"
                  disabled={processing}
                  onClick={handleStart}
                >
                  {processing ? t('maintenance.staff.starting') : t('maintenance.staff.start')}
                </button>
              )}

              {canComplete && (
                <form className="panel-form" onSubmit={handleComplete}>
                  <label htmlFor="maintenanceResultNote">{t('maintenance.staff.resultNote')}</label>
                  <textarea
                    id="maintenanceResultNote"
                    name="resultNote"
                    rows="4"
                    value={completionForm.resultNote}
                    onChange={handleCompletionChange}
                    required
                  />

                  <label htmlFor="maintenanceResultImage">{t('maintenance.staff.resultImage')}</label>
                  <input
                    id="maintenanceResultImage"
                    name="resultImage"
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handleCompletionChange}
                  />

                  <button type="submit" disabled={processing}>
                    {processing ? t('maintenance.staff.completing') : t('maintenance.staff.complete')}
                  </button>
                </form>
              )}

            </div>
          )}
        </div>
      </ActionDialog>
    </section>
  );
}
