import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as memberApi from '../../features/residents/api.js';
import * as vehicleApi from '../../features/residents/vehicleApi.js';
import ManagementPageHero from '../../components/common/ManagementPageHero.jsx';
import ActionDialog from '../../components/common/ActionDialog.jsx';
import LineIcon from '../../components/common/LineIcon.jsx';
import VehicleForm from '../../components/VehicleForm.jsx';
import VehicleTable from '../../components/VehicleTable.jsx';

function canRequestCancel(vehicle) {
  return vehicle.status === 'PENDING' || vehicle.status === 'ACTIVE' || vehicle.status === 'REJECTED';
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
  const [showRequestForm, setShowRequestForm] = useState(false);

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
      setShowRequestForm(false);
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

  const handleCloseRequestForm = () => {
    if (!saving) {
      setShowRequestForm(false);
    }
  };

  const renderActions = (vehicle) => (
    <div className="table-actions">
      {canRequestCancel(vehicle) ? (
        <button
          aria-label={t('common.cancel')}
          className="icon-action-button icon-action-danger"
          data-tooltip={t('common.cancel')}
          type="button"
          disabled={processingId === vehicle.id}
          onClick={() => handleRequestCancel(vehicle)}
        >
          <LineIcon name="close" />
        </button>
      ) : (
        <span className="muted-text">{t('vehicles.noAction')}</span>
      )}
    </div>
  );

  return (
    <section className="content-section resident-vehicle-page">
      <ManagementPageHero
        actions={
          !showRequestForm && (
            <button className="button-link hero-action-button" type="button" onClick={() => setShowRequestForm(true)}>
              <LineIcon name="plus" />
              {t('vehicles.registerButton')}
            </button>
          )
        }
        description={t('vehicles.residentDescription')}
        title={t('vehicles.title')}
      />

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      <section className="vehicle-workspace vehicle-workspace-list-only">
        <div>
          {loading ? (
            <div className="empty-state">{t('vehicles.loading')}</div>
          ) : (
            <VehicleTable variant="resident" vehicles={vehicles} renderActions={renderActions} />
          )}
        </div>
      </section>

      <ActionDialog
        className="resident-vehicle-request-dialog"
        eyebrow={t('vehicles.requestEyebrow')}
        labelledBy="resident-vehicle-request-dialog-title"
        open={showRequestForm}
        title={t('vehicles.requestTitle')}
        onClose={handleCloseRequestForm}
      >
        <VehicleForm
          key={formKey}
          approvedMembers={approvedMembers}
          loading={saving}
          onCancel={handleCloseRequestForm}
          onSubmit={handleRequestVehicle}
        />
      </ActionDialog>
    </section>
  );
}
