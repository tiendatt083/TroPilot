import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import * as utilityReadingApi from '../../features/invoices/utilityReadingApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import UtilityReadingTable from '../../components/UtilityReadingTable.jsx';

export default function StaffUtilityReadingListPage() {
  const { t } = useTranslation();
  const [readings, setReadings] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    utilityReadingApi
      .getStaffUtilityReadings()
      .then((response) => {
        if (active) {
          setReadings(response.data);
        }
      })
      .catch((apiError) => {
        if (active) {
          setError(apiError.response?.data?.message || t('utilityReadingManagement.loadError'));
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
        <PageHeader eyebrow={t('role.staff')} title={t('utilityReadingManagement.title')} />
        <Link className="button-link" to="/staff/utility-readings/create">
          {t('utilityReadingManagement.record')}
        </Link>
      </div>

      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('utilityReadingManagement.loading')}</div>
      ) : (
        <UtilityReadingTable readings={readings} />
      )}
    </section>
  );
}
