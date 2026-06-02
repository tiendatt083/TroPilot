import { useEffect, useState } from 'react';
import * as serviceFeeApi from '../../api/serviceFeeApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import ServiceFeeTable from '../../components/ServiceFeeTable.jsx';

export default function StaffServiceFeeListPage() {
  const [serviceFees, setServiceFees] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    serviceFeeApi
      .getStaffServiceFees()
      .then((response) => {
        if (active) {
          setServiceFees(response.data);
        }
      })
      .catch((apiError) => {
        if (active) {
          setError(apiError.response?.data?.message || 'Service fees could not be loaded');
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
      <PageHeader eyebrow="Operations staff" title="Service fees" />

      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading service fees...</div>
      ) : (
        <ServiceFeeTable serviceFees={serviceFees} showBuilding />
      )}
    </section>
  );
}
