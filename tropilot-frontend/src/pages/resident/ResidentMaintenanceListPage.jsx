import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import * as maintenanceApi from '../../features/maintenance/api.js';
import MaintenanceRequestTable from '../../components/MaintenanceRequestTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';

export default function ResidentMaintenanceListPage() {
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
          setError(apiError.response?.data?.message || 'Maintenance requests could not be loaded');
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
        <PageHeader eyebrow="Head resident" title="Maintenance requests" />
        <Link className="button-link" to="/resident/maintenance/create">
          Create request
        </Link>
      </div>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading maintenance requests...</div>
      ) : (
        <MaintenanceRequestTable requests={requests} />
      )}
    </section>
  );
}
