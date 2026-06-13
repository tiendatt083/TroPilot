import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import * as maintenanceApi from '../../features/maintenance/api.js';
import MaintenanceRequestDetail from '../../components/MaintenanceRequestDetail.jsx';
import MaintenanceRequestTable from '../../components/MaintenanceRequestTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';

export default function StaffMaintenancePage() {
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
      setError(apiError.response?.data?.message || 'Maintenance requests could not be loaded');
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
      setMessage('Maintenance request started successfully.');
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Maintenance request could not be started');
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
      setMessage('Maintenance request completed successfully.');
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Maintenance request could not be completed');
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
      setMessage('Maintenance request rejected successfully.');
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Maintenance request could not be rejected');
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
        eyebrow={building ? 'Building maintenance' : 'Operations staff'}
        title={building ? 'Maintenance requests in this building' : 'Maintenance requests'}
      />

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading maintenance requests...</div>
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
                <PageHeader eyebrow="Actions" title="Request progress" />

                {canStart && (
                  <button className="inline-button" type="button" disabled={processing} onClick={handleStart}>
                    {processing ? 'Starting...' : 'Start request'}
                  </button>
                )}

                {canComplete && (
                  <form className="panel-form" onSubmit={handleComplete}>
                    <label htmlFor="maintenanceResultNote">Result note</label>
                    <textarea
                      id="maintenanceResultNote"
                      name="resultNote"
                      rows="5"
                      value={completionForm.resultNote}
                      onChange={handleCompletionChange}
                      required
                    />

                    <label htmlFor="maintenanceResultImage">Result image</label>
                    <input
                      id="maintenanceResultImage"
                      name="resultImage"
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={handleCompletionChange}
                    />

                    <button type="submit" disabled={processing}>
                      {processing ? 'Completing...' : 'Complete request'}
                    </button>
                  </form>
                )}

                {canReject && (
                  <form className="panel-form" onSubmit={handleReject}>
                    <label htmlFor="maintenanceRejectNote">Rejection note</label>
                    <textarea
                      id="maintenanceRejectNote"
                      name="rejectNote"
                      rows="4"
                      value={rejectNote}
                      onChange={(event) => setRejectNote(event.target.value)}
                    />
                    <button className="secondary-button" type="submit" disabled={processing}>
                      {processing ? 'Rejecting...' : 'Reject request'}
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
                    Create linked expense
                  </Link>
                )}

                {!canStart && !canComplete && !canReject && (
                  <div className="empty-state">No staff action is available for this maintenance status.</div>
                )}
              </div>
            )}
          </aside>
        </section>
      )}
    </section>
  );
}
