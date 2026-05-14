import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as utilityReadingApi from '../../api/utilityReadingApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import UtilityReadingTable from '../../components/UtilityReadingTable.jsx';

export default function StaffUtilityReadingListPage() {
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
          setError(apiError.response?.data?.message || 'Utility readings could not be loaded');
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
        <PageHeader eyebrow="Operations staff" title="Utility readings" />
        <Link className="button-link" to="/staff/utility-readings/create">
          Record reading
        </Link>
      </div>

      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading utility readings...</div>
      ) : (
        <UtilityReadingTable readings={readings} />
      )}
    </section>
  );
}
