import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import * as maintenanceApi from '../../features/maintenance/api.js';
import MaintenanceRequestTable from '../../components/MaintenanceRequestTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';

export default function ResidentMaintenanceListPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState(location.state?.message || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    maintenanceApi
      .getResidentMaintenanceRequests()
      .then((response) => {
        if (active) {
          setRequests(response.data);
        }
      })
      .catch((apiError) => {
        if (active) {
          setError(apiError.response?.data?.message || t('maintenance.loadError'));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="content-section">
      <div className="page-title-row">
        <PageHeader eyebrow={t('resident.eyebrow')} title={t('maintenance.title')} />
        <Link className="button-link" to="/resident/maintenance/create">
          {t('maintenance.create')}
        </Link>
      </div>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('maintenance.loading')}</div>
      ) : (
        <MaintenanceRequestTable requests={requests} />
      )}
    </section>
  );
}
