import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useOutletContext } from 'react-router-dom';
import * as maintenanceApi from '../../features/maintenance/api.js';
import MaintenanceRequestDetail from '../../components/MaintenanceRequestDetail.jsx';
import MaintenanceRequestTable from '../../components/MaintenanceRequestTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';

export default function StaffMaintenancePage() {
  const { t } = useTranslation();
  const outletContext = useOutletContext();
  const building = outletContext?.building;
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [completionForm, setCompletionForm] = useState({
    resultNote: '',
    resultImage: null
  });
  const [rejectNote, setRejectNote] = useState('');

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

  return (
    <section className={building ? 'building-workspace' : 'content-section'}>
      <PageHeader
        eyebrow={building ? t('maintenance.staff.buildingEyebrow') : t('maintenance.staff.eyebrow')}
        title={building ? t('maintenance.staff.buildingTitle') : t('maintenance.title')}
      />

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('maintenance.loading')}</div>
      ) : (
        <section className="maintenance-workspace">
          <MaintenanceRequestTable
            requests={requests}
            selectedId={selectedRequest?.id}
            onSelect={setSelectedRequest}
          />

          <aside className="maintenance-actions-panel">
            <MaintenanceRequestDetail request={selectedRequest} />

            {selectedRequest && (
              <div className="task-actions-panel">
                <PageHeader eyebrow={t('maintenance.staff.actions')} title={t('maintenance.staff.progress')} />

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
                      rows="5"
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
                      rows="4"
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
                      roomId: selectedRequest.roomId,
                      maintenanceRequestId: selectedRequest.id,
                      expenseType: 'MAINTENANCE',
                      content: `Maintenance request #${selectedRequest.id}: ${selectedRequest.title}`
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
          </aside>
        </section>
      )}
    </section>
  );
}
