import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as vehicleApi from '../../features/residents/vehicleApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import VehicleTable from '../../components/VehicleTable.jsx';

export default function StaffVehicleListPage() {
  const { t } = useTranslation();
  const [vehicles, setVehicles] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    vehicleApi
      .getStaffVehicles()
      .then((response) => {
        if (active) {
          setVehicles(response.data);
        }
      })
      .catch((apiError) => {
        if (active) {
          setError(apiError.response?.data?.message || t('vehicleManagement.loadError'));
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
      <PageHeader eyebrow={t('role.staff')} title={t('vehicleManagement.title')} />

      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('vehicleManagement.loading')}</div>
      ) : (
        <VehicleTable vehicles={vehicles} />
      )}
    </section>
  );
}
