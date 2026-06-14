import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import * as vehicleApi from '../../features/residents/vehicleApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import VehicleTable from '../../components/VehicleTable.jsx';

function hasVehicleActions(vehicle) {
  return vehicle.status === 'PENDING' || vehicle.status === 'ACTIVE';
}

export default function AdminVehicleListPage() {
  const { t } = useTranslation();
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
      setError(apiError.response?.data?.message || t('vehicleManagement.loadError'));
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
        setMessage(t('vehicleManagement.approved'));
      }

      if (action === 'reject') {
        await vehicleApi.rejectVehicle(vehicle.id);
        setMessage(t('vehicleManagement.rejected'));
      }

      if (action === 'deactivate') {
        await vehicleApi.deactivateVehicle(vehicle.id);
        setMessage(t('vehicleManagement.deactivated'));
      }

      await loadVehicles();
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('vehicleManagement.actionError'));
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
            {t('vehicleManagement.approve')}
          </button>
          <button
            className="secondary-button compact-button"
            type="button"
            disabled={processingId === vehicle.id}
            onClick={() => handleAction(vehicle, 'reject')}
          >
            {t('vehicleManagement.reject')}
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
          {t('vehicleManagement.deactivate')}
        </button>
      )}
      {!hasVehicleActions(vehicle) && <span className="muted-text">{t('vehicleManagement.noAction')}</span>}
    </div>
  );

  return (
    <section className="content-section">
      <div className="page-title-row">
        <PageHeader eyebrow={t('role.admin')} title={t('vehicleManagement.title')} />
        <Link className="button-link" to="/admin/vehicles/pending">
          {t('vehicleManagement.pendingTitle')}
        </Link>
      </div>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('vehicleManagement.loading')}</div>
      ) : (
        <VehicleTable vehicles={vehicles} renderActions={renderActions} />
      )}
    </section>
  );
}
