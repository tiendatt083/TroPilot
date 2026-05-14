import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as vehicleApi from '../../api/vehicleApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import VehicleTable from '../../components/VehicleTable.jsx';

function hasVehicleActions(vehicle) {
  return vehicle.status === 'PENDING' || vehicle.status === 'ACTIVE';
}

export default function AdminVehicleListPage() {
  const [vehicles, setVehicles] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const loadVehicles = async () => {
    setError('');

    try {
      const response = await vehicleApi.getAdminVehicles();
      setVehicles(response.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Vehicles could not be loaded');
    }
  };

  useEffect(() => {
    loadVehicles().finally(() => setLoading(false));
  }, []);

  const handleAction = async (vehicle, action) => {
    setProcessingId(vehicle.id);
    setMessage('');
    setError('');

    try {
      if (action === 'approve') {
        await vehicleApi.approveVehicle(vehicle.id);
        setMessage('Vehicle approved successfully.');
      }

      if (action === 'reject') {
        await vehicleApi.rejectVehicle(vehicle.id);
        setMessage('Vehicle rejected successfully.');
      }

      if (action === 'deactivate') {
        await vehicleApi.deactivateVehicle(vehicle.id);
        setMessage('Vehicle deactivated successfully.');
      }

      await loadVehicles();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Vehicle action could not be completed');
    } finally {
      setProcessingId(null);
    }
  };

  const renderActions = (vehicle) => (
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
      {hasVehicleActions(vehicle) && (
        <button
          className="secondary-button compact-button"
          type="button"
          disabled={processingId === vehicle.id}
          onClick={() => handleAction(vehicle, 'deactivate')}
        >
          Deactivate
        </button>
      )}
      {!hasVehicleActions(vehicle) && <span className="muted-text">No action</span>}
    </div>
  );

  return (
    <section className="content-section">
      <div className="page-title-row">
        <PageHeader eyebrow="Administrator" title="Vehicles" />
        <Link className="button-link" to="/admin/vehicles/pending">
          Pending vehicles
        </Link>
      </div>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading vehicles...</div>
      ) : (
        <VehicleTable vehicles={vehicles} renderActions={renderActions} />
      )}
    </section>
  );
}
