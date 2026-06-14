import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import * as vehicleApi from '../../features/residents/vehicleApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import VehicleTable from '../../components/VehicleTable.jsx';

export default function AdminPendingVehiclesPage() {
  const { t } = useTranslation();
  const [vehicles, setVehicles] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const loadVehicles = async () => {
    setError('');

    try {
      const response = await vehicleApi.getPendingVehicles();
      setVehicles(response.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('vehicleManagement.pendingLoadError'));
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
      } else {
        await vehicleApi.rejectVehicle(vehicle.id);
        setMessage(t('vehicleManagement.rejected'));
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
    </div>
  );

  return (
    <section className="content-section">
      <div className="page-title-row">
        <PageHeader eyebrow={t('role.admin')} title={t('vehicleManagement.pendingTitle')} />
        <Link className="secondary-link" to="/admin/vehicles">
          {t('vehicleManagement.allVehicles')}
        </Link>
      </div>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('vehicleManagement.loadingPending')}</div>
      ) : (
        <VehicleTable vehicles={vehicles} renderActions={renderActions} />
      )}
    </section>
  );
}
