import { useEffect, useState } from 'react';
import * as paymentApi from '../../api/paymentApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import PaymentTable from '../../components/PaymentTable.jsx';

export default function StaffPendingPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const loadPayments = async () => {
    setError('');

    try {
      const response = await paymentApi.getPendingPayments();
      setPayments(response.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Pending payments could not be loaded');
    }
  };

  useEffect(() => {
    loadPayments().finally(() => setLoading(false));
  }, []);

  const handleApprove = async (payment) => {
    setProcessingId(payment.id);
    setMessage('');
    setError('');

    try {
      await paymentApi.approvePayment(payment.id, { note: 'Payment proof approved' });
      setMessage('Payment approved successfully.');
      await loadPayments();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Payment could not be approved');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (payment) => {
    const note = window.prompt('Enter rejection note');

    if (note === null) {
      return;
    }

    setProcessingId(payment.id);
    setMessage('');
    setError('');

    try {
      await paymentApi.rejectPayment(payment.id, { note: note || 'Payment proof rejected' });
      setMessage('Payment rejected successfully.');
      await loadPayments();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Payment could not be rejected');
    } finally {
      setProcessingId(null);
    }
  };

  const renderActions = (payment) => (
    <div className="table-actions">
      <button
        className="compact-button"
        type="button"
        disabled={processingId === payment.id}
        onClick={() => handleApprove(payment)}
      >
        Approve
      </button>
      <button
        className="secondary-button compact-button"
        type="button"
        disabled={processingId === payment.id}
        onClick={() => handleReject(payment)}
      >
        Reject
      </button>
    </div>
  );

  return (
    <section className="content-section">
      <PageHeader eyebrow="Operations staff" title="Pending payments" />

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading pending payments...</div>
      ) : (
        <PaymentTable payments={payments} renderActions={renderActions} />
      )}
    </section>
  );
}
