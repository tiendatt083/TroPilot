import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import * as maintenanceApi from '../../features/maintenance/api.js';
import MaintenanceRequestForm from '../../components/MaintenanceRequestForm.jsx';
import ManagementPageHero from '../../components/common/ManagementPageHero.jsx';

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
      <ManagementPageHero
        actions={(
          <Link className="secondary-link" to="/resident/maintenance">
            {t('maintenance.back')}
          </Link>
        )}
        description={t('maintenance.createDescription')}
        title={t('maintenance.createTitle')}
      />

      {error && <div className="alert error-alert">{error}</div>}

      <MaintenanceRequestForm loading={saving} onSubmit={handleSubmit} />
    </section>
  );
}
