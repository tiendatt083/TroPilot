import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import * as vehicleApi from '../../api/vehicleApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import VehicleTable from '../../components/VehicleTable.jsx';

export default function StaffBuildingVehiclePage() {
  const { building } = useOutletContext();
  const [vehicles, setVehicles] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError('');

    vehicleApi
      .getStaffVehicles({ buildingId: building.id })
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
  }, [building.id]);

  return (
    <div className="building-workspace">
      <PageHeader eyebrow="Building vehicles" title="Vehicles in this building" />
      {error && <div className="alert error-alert">{error}</div>}
      {loading ? <div className="empty-state">Loading vehicles...</div> : <VehicleTable vehicles={vehicles} />}
    </div>
  );
}
