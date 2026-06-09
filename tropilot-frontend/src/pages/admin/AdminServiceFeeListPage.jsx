import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import * as serviceFeeApi from '../../api/serviceFeeApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import ServiceFeeTable from '../../components/ServiceFeeTable.jsx';
import { isServiceFeeActive } from '../../utils/serviceFeeOptions.js';

export default function AdminServiceFeeListPage() {
  const location = useLocation();
  const [serviceFees, setServiceFees] = useState([]);
  const [message, setMessage] = useState(location.state?.message || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const loadServiceFees = async () => {
    setError('');

    try {
      const response = await serviceFeeApi.getAdminServiceFees();
      setServiceFees(response.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Service fees could not be loaded');
    }
  };

  useEffect(() => {
    loadServiceFees().finally(() => setLoading(false));
  }, []);

  const handleToggle = async (serviceFee) => {
    setProcessingId(serviceFee.id);
    setMessage('');
    setError('');

    try {
      await serviceFeeApi.toggleAdminServiceFee(serviceFee.id);
      setMessage('Service fee status updated successfully.');
      await loadServiceFees();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Service fee status could not be updated');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (serviceFee) => {
    const confirmed = window.confirm(`Delete service fee ${serviceFee.name}?`);
    if (!confirmed) {
      return;
    }

    setProcessingId(serviceFee.id);
    setMessage('');
    setError('');

    try {
      const response = await serviceFeeApi.deleteAdminServiceFee(serviceFee.id);
      setMessage(response.message || 'Service fee deleted successfully.');
      await loadServiceFees();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Service fee could not be deleted');
    } finally {
      setProcessingId(null);
    }
  };

  const renderActions = (serviceFee) => (
    <div className="table-actions">
      <Link className="secondary-link compact-link" to={`/admin/service-fees/${serviceFee.id}/edit`}>
        Edit
      </Link>
      <button
        className="secondary-button compact-button"
        type="button"
        disabled={processingId === serviceFee.id}
        onClick={() => handleToggle(serviceFee)}
      >
        {isServiceFeeActive(serviceFee) ? 'Deactivate' : 'Activate'}
      </button>
      <button
        className="secondary-button compact-button"
        type="button"
        disabled={processingId === serviceFee.id}
        onClick={() => handleDelete(serviceFee)}
      >
        Delete
      </button>
    </div>
  );

  return (
    <section className="content-section">
      <div className="page-title-row">
        <PageHeader eyebrow="Administrator" title="Service fees" />
        <Link className="button-link" to="/admin/service-fees/create">
          Create service fee
        </Link>
      </div>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading service fees...</div>
      ) : (
        <ServiceFeeTable serviceFees={serviceFees} renderActions={renderActions} />
      )}
    </section>
  );
}
