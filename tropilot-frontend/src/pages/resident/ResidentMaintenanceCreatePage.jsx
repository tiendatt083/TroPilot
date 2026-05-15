import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as maintenanceApi from '../../api/maintenanceApi.js';
import MaintenanceRequestForm from '../../components/MaintenanceRequestForm.jsx';
import PageHeader from '../../components/PageHeader.jsx';

export default function ResidentMaintenanceCreatePage() {
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
        state: { message: 'Maintenance request created successfully.' }
      });
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Maintenance request could not be created');
      throw apiError;
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="content-section narrow-section">
      <div className="page-title-row">
        <PageHeader eyebrow="Head resident" title="Create maintenance request" />
        <Link className="secondary-link" to="/resident/maintenance">
          Back to maintenance
        </Link>
      </div>

      {error && <div className="alert error-alert">{error}</div>}

      <MaintenanceRequestForm loading={saving} onSubmit={handleSubmit} />
    </section>
  );
}
