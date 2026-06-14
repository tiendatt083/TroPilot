import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as memberApi from '../../features/residents/api.js';
import * as vehicleApi from '../../features/residents/vehicleApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import VehicleForm from '../../components/VehicleForm.jsx';
import VehicleTable from '../../components/VehicleTable.jsx';

function canRequestCancel(vehicle) {
  return vehicle.status === 'PENDING' || vehicle.status === 'ACTIVE';
}

export default function ResidentVehiclePage() {
  const { t } = useTranslation();
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
      setError(apiError.response?.data?.message || t('vehicles.loadError'));
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
      setMessage(t('vehicles.submitted'));
      setFormKey((current) => current + 1);
      await loadData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('vehicles.submitError'));
    } finally {
      setSaving(false);
    }
  };

  const handleRequestCancel = async (vehicle) => {
    const confirmed = window.confirm(t('vehicles.cancelConfirm', { plate: vehicle.licensePlate }));
    if (!confirmed) {
      return;
    }

    setProcessingId(vehicle.id);
    setMessage('');
    setError('');

    try {
      await vehicleApi.requestVehicleCancel(vehicle.id);
      setMessage(t('vehicles.cancelled'));
      await loadData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('vehicles.cancelError'));
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
          {t('common.cancel')}
        </button>
      ) : (
        <span className="muted-text">{t('vehicles.noAction')}</span>
      )}
    </div>
  );

  return (
    <section className="content-section">
      <PageHeader eyebrow={t('resident.eyebrow')} title={t('vehicles.title')} />

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      <section className="vehicle-workspace">
        <div>
          <PageHeader eyebrow={t('vehicles.requestEyebrow')} title={t('vehicles.requestTitle')} />
          <VehicleForm key={formKey} approvedMembers={approvedMembers} loading={saving} onSubmit={handleRequestVehicle} />
        </div>

        <div>
          {loading ? (
            <div className="empty-state">{t('vehicles.loading')}</div>
          ) : (
            <VehicleTable vehicles={vehicles} renderActions={renderActions} />
          )}
        </div>
      </section>
    </section>
  );
}
