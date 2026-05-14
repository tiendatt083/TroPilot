import { useEffect, useState } from 'react';
import * as vehicleApi from '../../api/vehicleApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import VehicleTable from '../../components/VehicleTable.jsx';

export default function StaffVehicleListPage() {
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
          setError(apiError.response?.data?.message || 'Vehicles could not be loaded');
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
      <PageHeader eyebrow="Operations staff" title="Vehicles" />

      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading vehicles...</div>
      ) : (
        <VehicleTable vehicles={vehicles} />
      )}
    </section>
  );
}
