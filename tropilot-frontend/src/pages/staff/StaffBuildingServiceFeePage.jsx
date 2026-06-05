import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import * as serviceFeeApi from '../../api/serviceFeeApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import ServiceFeeTable from '../../components/ServiceFeeTable.jsx';

export default function StaffBuildingServiceFeePage() {
  const { t } = useTranslation();
  const { building } = useOutletContext();
  const [serviceFees, setServiceFees] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const buildingServiceFees = useMemo(() => {
    return serviceFees.filter((serviceFee) => serviceFee.buildingId === building.id);
  }, [serviceFees, building.id]);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError('');

    serviceFeeApi
      .getStaffServiceFees()
      .then((response) => {
        if (active) {
          setServiceFees(response.data);
        }
      })
      .catch((apiError) => {
        if (active) {
          setError(apiError.response?.data?.message || t('buildingServiceFees.loadError'));
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
  }, [t]);

  return (
    <section className="building-workspace">
      <PageHeader eyebrow={t('buildingWorkspace.serviceFees')} title={t('navigation.serviceFees')} />

      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('buildingServiceFees.loading')}</div>
      ) : (
        <ServiceFeeTable serviceFees={buildingServiceFees} />
      )}
    </section>
  );
}
