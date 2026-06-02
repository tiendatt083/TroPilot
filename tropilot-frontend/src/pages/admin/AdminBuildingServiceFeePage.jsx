import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import * as serviceFeeApi from '../../api/serviceFeeApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import ServiceFeeForm from '../../components/ServiceFeeForm.jsx';
import ServiceFeeTable from '../../components/ServiceFeeTable.jsx';
import { isServiceFeeActive } from '../../utils/serviceFeeOptions.js';

export default function AdminBuildingServiceFeePage() {
  const { t } = useTranslation();
  const { building } = useOutletContext();
  const [serviceFees, setServiceFees] = useState([]);
  const [editingServiceFee, setEditingServiceFee] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const loadServiceFees = async () => {
    setError('');

    try {
      const response = await serviceFeeApi.getAdminBuildingServiceFees(building.id);
      setServiceFees(response.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('buildingServiceFees.loadError'));
    }
  };

  useEffect(() => {
    setLoading(true);
    setEditingServiceFee(null);
    loadServiceFees().finally(() => setLoading(false));
  }, [building.id, t]);

  const handleSubmit = async (payload) => {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      if (editingServiceFee) {
        await serviceFeeApi.updateAdminBuildingServiceFee(building.id, editingServiceFee.id, payload);
        setMessage(t('buildingServiceFees.updated'));
      } else {
        await serviceFeeApi.createAdminBuildingServiceFee(building.id, payload);
        setMessage(t('buildingServiceFees.created'));
      }

      setEditingServiceFee(null);
      await loadServiceFees();
    } catch (apiError) {
      setError(
        apiError.response?.data?.message ||
          (editingServiceFee ? t('buildingServiceFees.updateError') : t('buildingServiceFees.createError'))
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (serviceFee) => {
    setProcessingId(serviceFee.id);
    setMessage('');
    setError('');

    try {
      await serviceFeeApi.toggleAdminBuildingServiceFee(building.id, serviceFee.id);
      setMessage(t('buildingServiceFees.statusUpdated'));
      await loadServiceFees();
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('buildingServiceFees.statusUpdateError'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (serviceFee) => {
    const confirmed = window.confirm(t('buildingServiceFees.deleteConfirm', { code: serviceFee.feeCode }));
    if (!confirmed) {
      return;
    }

    setProcessingId(serviceFee.id);
    setMessage('');
    setError('');

    try {
      const response = await serviceFeeApi.deleteAdminBuildingServiceFee(building.id, serviceFee.id);
      setMessage(response.message || t('buildingServiceFees.deleted'));
      if (editingServiceFee?.id === serviceFee.id) {
        setEditingServiceFee(null);
      }
      await loadServiceFees();
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('buildingServiceFees.deleteError'));
    } finally {
      setProcessingId(null);
    }
  };

  const renderActions = (serviceFee) => (
    <div className="table-actions">
      <button
        className="secondary-button compact-button"
        type="button"
        disabled={processingId === serviceFee.id}
        onClick={() => setEditingServiceFee(serviceFee)}
      >
        {t('common.edit')}
      </button>
      <button
        className="secondary-button compact-button"
        type="button"
        disabled={processingId === serviceFee.id}
        onClick={() => handleToggle(serviceFee)}
      >
        {isServiceFeeActive(serviceFee) ? t('common.deactivate') : t('common.activate')}
      </button>
      <button
        className="secondary-button compact-button"
        type="button"
        disabled={processingId === serviceFee.id}
        onClick={() => handleDelete(serviceFee)}
      >
        {t('common.delete')}
      </button>
    </div>
  );

  return (
    <div className="building-workspace">
      <PageHeader eyebrow={t('buildingServiceFees.eyebrow')} title={t('buildingServiceFees.title')} />
      <p className="page-support-text">{t('buildingServiceFees.description')}</p>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('buildingServiceFees.loading')}</div>
      ) : (
        <section className="service-fee-workspace">
          <div>
            <PageHeader
              eyebrow={t('buildingServiceFees.formEyebrow')}
              title={editingServiceFee ? t('buildingServiceFees.editTitle') : t('buildingServiceFees.createTitle')}
            />
            <ServiceFeeForm
              initialValues={editingServiceFee}
              loading={saving}
              submitLabel={editingServiceFee ? t('buildingServiceFees.save') : t('buildingServiceFees.create')}
              onSubmit={handleSubmit}
            />
            {editingServiceFee && (
              <button
                className="secondary-button inline-button"
                type="button"
                disabled={saving}
                onClick={() => setEditingServiceFee(null)}
              >
                {t('buildingServiceFees.cancelEdit')}
              </button>
            )}
          </div>
          <div>
            <PageHeader eyebrow={t('buildingServiceFees.recordsEyebrow')} title={t('buildingServiceFees.recordsTitle')} />
            <ServiceFeeTable serviceFees={serviceFees} renderActions={renderActions} />
          </div>
        </section>
      )}
    </div>
  );
}
