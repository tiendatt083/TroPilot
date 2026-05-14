import { useEffect, useMemo, useState } from 'react';
import * as memberApi from '../../api/memberApi.js';
import * as vehicleApi from '../../api/vehicleApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import VehicleForm from '../../components/VehicleForm.jsx';
import VehicleTable from '../../components/VehicleTable.jsx';

function canRequestCancel(vehicle) {
  return vehicle.status === 'PENDING' || vehicle.status === 'ACTIVE';
}

export default function ResidentVehiclePage() {
  const [vehicles, setVehicles] = useState([]);
  const [members, setMembers] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [formKey, setFormKey] = useState(0);

  const approvedMembers = useMemo(
    () => members.filter((member) => member.status === 'APPROVED'),
    [members]
  );

  const loadData = async () => {
    setError('');

    try {
      const [vehiclesResponse, membersResponse] = await Promise.all([
        vehicleApi.getResidentVehicles(),
        memberApi.getResidentMembers()
      ]);
      setVehicles(vehiclesResponse.data);
      setMembers(membersResponse.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Vehicles could not be loaded');
    }
  };

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, []);

  const handleRequestVehicle = async (payload) => {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await vehicleApi.requestResidentVehicle(payload);
      setMessage('Vehicle registration submitted for approval successfully.');
      setFormKey((current) => current + 1);
      await loadData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Vehicle registration could not be submitted');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestCancel = async (vehicle) => {
    const confirmed = window.confirm(`Request cancellation for vehicle ${vehicle.licensePlate}?`);
    if (!confirmed) {
      return;
    }

    setProcessingId(vehicle.id);
    setMessage('');
    setError('');

    try {
      await vehicleApi.requestVehicleCancel(vehicle.id);
      setMessage('Vehicle cancellation requested successfully.');
      await loadData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Vehicle cancellation could not be requested');
    } finally {
      setProcessingId(null);
    }
  };

  const renderActions = (vehicle) => (
    <div className="table-actions">
      {canRequestCancel(vehicle) ? (
        <button
          className="secondary-button compact-button"
          type="button"
          disabled={processingId === vehicle.id}
          onClick={() => handleRequestCancel(vehicle)}
        >
          Cancel
        </button>
      ) : (
        <span className="muted-text">No action</span>
      )}
    </div>
  );

  return (
    <section className="content-section">
      <PageHeader eyebrow="Head resident" title="Vehicles" />

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      <section className="vehicle-workspace">
        <div>
          <PageHeader eyebrow="New request" title="Request vehicle registration" />
          <VehicleForm key={formKey} approvedMembers={approvedMembers} loading={saving} onSubmit={handleRequestVehicle} />
        </div>

        <div>
          {loading ? (
            <div className="empty-state">Loading vehicles...</div>
          ) : (
            <VehicleTable vehicles={vehicles} renderActions={renderActions} />
          )}
        </div>
      </section>
    </section>
  );
}
