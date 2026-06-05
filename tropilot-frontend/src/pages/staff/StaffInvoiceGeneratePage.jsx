import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as invoiceApi from '../../api/invoiceApi.js';
import * as roomApi from '../../api/roomApi.js';
import InvoiceGenerateForm from '../../components/InvoiceGenerateForm.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { isOccupiedRoom } from '../../utils/roomEligibility.js';

export default function StaffInvoiceGeneratePage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [generating, setGenerating] = useState(false);
  const occupiedRooms = useMemo(() => rooms.filter(isOccupiedRoom), [rooms]);

  useEffect(() => {
    roomApi
      .getStaffRooms()
      .then((response) => setRooms(response.data))
      .catch((apiError) => setError(apiError.response?.data?.message || 'Rooms could not be loaded'))
      .finally(() => setLoadingRooms(false));
  }, []);

  const handleSubmit = async (payload) => {
    setGenerating(true);
    setError('');

    try {
      await invoiceApi.generateInvoice(payload);
      navigate('/staff/invoices', { replace: true });
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Invoice could not be generated');
      throw apiError;
    } finally {
      setGenerating(false);
    }
  };

  if (loadingRooms) {
    return <div className="empty-state">Loading rooms...</div>;
  }

  return (
    <section className="content-section narrow-section">
      <div className="page-title-row">
        <PageHeader eyebrow="Operations staff" title="Generate invoice" />
        <Link className="secondary-link" to="/staff/invoices">
          Back to invoices
        </Link>
      </div>

      {error && <div className="alert error-alert">{error}</div>}

      <InvoiceGenerateForm rooms={occupiedRooms} loading={generating} onSubmit={handleSubmit} />
    </section>
  );
}
