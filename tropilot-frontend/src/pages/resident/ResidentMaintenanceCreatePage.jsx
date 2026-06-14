import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import * as maintenanceApi from '../../features/maintenance/api.js';
import MaintenanceRequestForm from '../../components/MaintenanceRequestForm.jsx';
import PageHeader from '../../components/PageHeader.jsx';

export default function ResidentMaintenanceCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (payload) => {
    setSaving(true);
    setError('');

    try {
      await maintenanceApi.createResidentMaintenanceRequest(payload);
      navigate('/resident/maintenance', {
        replace: true,
        state: { message: t('maintenance.created') }
      });
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('maintenance.createError'));
      throw apiError;
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="content-section narrow-section">
      <div className="page-title-row">
        <PageHeader eyebrow={t('resident.eyebrow')} title={t('maintenance.createTitle')} />
        <Link className="secondary-link" to="/resident/maintenance">
          {t('maintenance.back')}
        </Link>
      </div>

      {error && <div className="alert error-alert">{error}</div>}

      <MaintenanceRequestForm loading={saving} onSubmit={handleSubmit} />
    </section>
  );
}
