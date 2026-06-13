import { useEffect, useState } from 'react';
import * as utilityReadingApi from '../../features/invoices/utilityReadingApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import { UtilityReadingTable } from '../../features/invoices/components/index.js';

export default function ResidentUtilityReadingPage() {
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
      <PageHeader eyebrow="Head resident" title="Utility readings" />

      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading utility readings...</div>
      ) : (
        <UtilityReadingTable readings={readings} />
      )}
    </section>
  );
}
