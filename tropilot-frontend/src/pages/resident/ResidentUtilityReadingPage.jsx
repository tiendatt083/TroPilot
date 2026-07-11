import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as utilityReadingApi from '../../features/invoices/utilityReadingApi.js';
import ManagementPageHero from '../../components/common/ManagementPageHero.jsx';
import { UtilityReadingTable } from '../../features/invoices/components/index.js';

export default function ResidentUtilityReadingPage() {
  const { t } = useTranslation();
  const [readings, setReadings] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    utilityReadingApi
      .getResidentUtilityReadings()
      .then((response) => {
        if (active) {
          setReadings(response.data);
        }
      })
      .catch((apiError) => {
        if (active) {
          setError(apiError.response?.data?.message || t('resident.utilityReadings.loadError'));
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
      <ManagementPageHero
        description={t('resident.utilityReadings.description')}
        title={t('resident.utilityReadings.title')}
      />

      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('resident.utilityReadings.loading')}</div>
      ) : (
        <UtilityReadingTable readings={readings} />
      )}
    </section>
  );
}
