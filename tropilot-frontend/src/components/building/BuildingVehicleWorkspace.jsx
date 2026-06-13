import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import * as vehicleApi from '../../features/residents/vehicleApi.js';
import PageHeader from '../PageHeader.jsx';
import VehicleTable from '../VehicleTable.jsx';

function hasVehicleActions(vehicle) {
  return vehicle.status === 'PENDING' || vehicle.status === 'ACTIVE';
}

export default function BuildingVehicleWorkspace({ getVehicles, canManage = false }) {
  const { building } = useOutletContext();
  const [vehicles, setVehicles] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const buildingFilter = { buildingId: building.id };

  const loadVehicles = async () => {
    setError('');

    try {
      const response = await getVehicles(buildingFilter);
      setVehicles(response.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Building vehicles could not be loaded');
    }
  };

  useEffect(() => {
    setLoading(true);
    loadVehicles().finally(() => setLoading(false));
  }, [building.id]);

  const handleAction = async (vehicle, action) => {
    setProcessingId(vehicle.id);
    setMessage('');
    setError('');

    try {
      if (action === 'approve') {
        await vehicleApi.approveVehicle(vehicle.id, buildingFilter);
        setMessage('Vehicle approved successfully.');
      } else if (action === 'reject') {
        await vehicleApi.rejectVehicle(vehicle.id, buildingFilter);
        setMessage('Vehicle rejected successfully.');
      } else {
        await vehicleApi.deactivateVehicle(vehicle.id, buildingFilter);
        setMessage('Vehicle deactivated successfully.');
      }

      await loadVehicles();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Vehicle action could not be completed');
    } finally {
      setProcessingId(null);
    }
  };

  const renderActions = canManage
    ? (vehicle) => (
        <div className="table-actions">
          {vehicle.status === 'PENDING' && (
            <>
              <button
                className="secondary-button compact-button"
                type="button"
                disabled={processingId === vehicle.id}
                onClick={() => handleAction(vehicle, 'approve')}
              >
                Approve
              </button>
              <button
                className="secondary-button compact-button"
                type="button"
                disabled={processingId === vehicle.id}
                onClick={() => handleAction(vehicle, 'reject')}
              >
                Reject
              </button>
            </>
          )}
          {hasVehicleActions(vehicle) ? (
            <button
              className="secondary-button compact-button"
              type="button"
              disabled={processingId === vehicle.id}
              onClick={() => handleAction(vehicle, 'deactivate')}
            >
              Deactivate
            </button>
          ) : (
            <span className="muted-text">No action</span>
          )}
        </div>
      )
    : undefined;

  return (
    <div className="building-workspace">
      <PageHeader eyebrow="Building vehicles" title="Vehicles in this building" />
      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}
      {loading ? (
        <div className="empty-state">Loading vehicles...</div>
      ) : (
        <VehicleTable vehicles={vehicles} renderActions={renderActions} />
      )}
    </div>
  );
}
