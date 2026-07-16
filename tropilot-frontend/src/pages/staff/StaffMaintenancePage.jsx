import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useOutletContext } from 'react-router-dom';
import * as maintenanceApi from '../../features/maintenance/api.js';
import ActionDialog from '../../components/common/ActionDialog.jsx';
import FilterBar from '../../components/common/FilterBar.jsx';
import LineIcon from '../../components/common/LineIcon.jsx';
import MaintenanceRequestDetail from '../../components/MaintenanceRequestDetail.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { formatDateTime, formatEnumLabel } from '../../utils/i18nFormat.js';
import { getMaintenanceStatusClass, MAINTENANCE_STATUS_OPTIONS } from '../../utils/maintenanceOptions.js';
import { formatRoomCode } from '../../utils/roomDisplay.js';
import { normalizeSearchText } from '../../utils/searchText.js';

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
    request.equipmentCode,
    request.equipmentName,
    request.status,
    request.createdAt
  ];

  return searchableValues.some((value) => normalizeSearchText(value).includes(searchValue));
}

export default function StaffMaintenancePage() {
  const { t } = useTranslation();
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
  const [rejectNote, setRejectNote] = useState('');
  const filteredRequests = useMemo(() => {
    const searchValue = normalizeSearchText(filters.search);

    return requests.filter((request) => (
      requestMatchesSearch(request, searchValue)
      && (!filters.status || request.status === filters.status)
    ));
  }, [filters, requests]);

  const loadRequests = async () => {
    setError('');

    try {
      const response = await maintenanceApi.getStaffMaintenanceRequests(building?.id ? { buildingId: building.id } : undefined);
      setRequests(response.data);
      setSelectedRequest((current) => {
        if (!current) {
          return response.data[0] || null;
        }

        return response.data.find((request) => request.id === current.id) || response.data[0] || null;
      });
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

  const handleReject = async (event) => {
    event.preventDefault();
    setProcessing(true);
    setMessage('');
    setError('');

    try {
      const response = await maintenanceApi.rejectStaffMaintenanceRequest(selectedRequest.id, {
        resultNote: rejectNote
      });
      refreshSelectedRequest(response.data);
      setRejectNote('');
      setMessage(t('maintenance.staff.rejected'));
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('maintenance.staff.rejectError'));
    } finally {
      setProcessing(false);
    }
  };

  const canStart = selectedRequest?.status === 'ASSIGNED';
  const canComplete = selectedRequest?.status === 'IN_PROGRESS';
  const canReject = selectedRequest?.status === 'ASSIGNED' || selectedRequest?.status === 'IN_PROGRESS';

  const openRequestDetail = (request) => {
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
    <section className={`${building ? 'building-workspace' : 'content-section'} staff-maintenance-page`}>
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
          <section className="maintenance-card-list maintenance-card-list-polished">
            {filteredRequests.map((request) => (
              <button
                className="maintenance-card"
                key={request.id}
                type="button"
                onClick={() => openRequestDetail(request)}
              >
                <span className="maintenance-card-accent" aria-hidden="true" />
                <span className="maintenance-card-main">
                  <span className="maintenance-card-type">
                    {request.equipmentId ? t('navigation.equipment') : t('tables.common.request')}
                  </span>
                  <strong>{request.title}</strong>
                  <small>{request.content || t('common.notProvided')}</small>
                </span>
                <span className="maintenance-card-meta-grid">
                  <span className="maintenance-card-meta">
                    <span>
                      <LineIcon name="home" />
                      {t('tables.common.room')}
                    </span>
                    <strong>{request.roomId ? formatRoomCode(request) : t('equipment.scopes.BUILDING')}</strong>
                  </span>
                  <span className="maintenance-card-meta">
                    <span>
                      <LineIcon name="user" />
                      {t('tables.common.requestedBy')}
                    </span>
                    <strong>{request.requestedByName || request.residentHeadName || t('common.notProvided')}</strong>
                  </span>
                  <span className="maintenance-card-meta">
                    <span>
                      <LineIcon name="calendar" />
                      {t('tables.common.created')}
                    </span>
                    <strong>{formatDateTime(request.createdAt, t)}</strong>
                  </span>
                </span>
                <span className="maintenance-card-state">
                  <span className={getMaintenanceStatusClass(request.status)}>
                    {formatEnumLabel(t, 'maintenanceStatus', request.status)}
                  </span>
                  <span className="maintenance-card-view icon-action-button" aria-hidden="true">
                    <LineIcon name="eye" />
                  </span>
                </span>
              </button>
            ))}
            {filteredRequests.length === 0 && (
              <div className="empty-state flat-empty-state">{t('tables.maintenanceRequests.empty')}</div>
            )}
          </section>
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

          {selectedRequest && (
            <div className="task-actions-panel maintenance-staff-action-panel">
              {canStart && (
                <button className="inline-button" type="button" disabled={processing} onClick={handleStart}>
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

              {canReject && (
                <form className="panel-form" onSubmit={handleReject}>
                  <label htmlFor="maintenanceRejectNote">{t('maintenance.staff.rejectionNote')}</label>
                  <textarea
                    id="maintenanceRejectNote"
                    name="rejectNote"
                    rows="3"
                    value={rejectNote}
                    onChange={(event) => setRejectNote(event.target.value)}
                  />
                  <button className="secondary-button" type="submit" disabled={processing}>
                    {processing ? t('maintenance.staff.rejecting') : t('maintenance.staff.reject')}
                  </button>
                </form>
              )}

              {selectedRequest.roomId && (
                <Link
                  className="secondary-link"
                  to={building ? `/staff/buildings/${building.id}/expenses` : '/staff/expenses/create'}
                  state={{
                    openCreateExpense: true,
                    roomId: selectedRequest.roomId,
                    maintenanceRequestId: selectedRequest.id,
                    equipmentId: selectedRequest.equipmentId || '',
                    equipmentCode: selectedRequest.equipmentCode || '',
                    expenseType: 'MAINTENANCE',
                    content: `Yêu cầu bảo trì #${selectedRequest.id}: ${selectedRequest.title}`
                  }}
                >
                  {t('maintenance.staff.linkedExpense')}
                </Link>
              )}

              {!canStart && !canComplete && !canReject && (
                <div className="empty-state">{t('maintenance.staff.noAction')}</div>
              )}
            </div>
          )}
        </div>
      </ActionDialog>
    </section>
  );
}
