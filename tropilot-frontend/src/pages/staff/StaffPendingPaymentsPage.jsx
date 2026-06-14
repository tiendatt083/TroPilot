import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as paymentApi from '../../features/payments/api.js';
import PageHeader from '../../components/PageHeader.jsx';
import PaymentTable from '../../components/PaymentTable.jsx';

export default function StaffPendingPaymentsPage() {
  const { t } = useTranslation();
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
      setError(apiError.response?.data?.message || t('pendingPaymentManagement.loadError'));
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
      await paymentApi.approvePayment(payment.id, { note: t('pendingPaymentManagement.approvedNote') });
      setMessage(t('pendingPaymentManagement.approved'));
      await loadPayments();
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('pendingPaymentManagement.approveError'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (payment) => {
    const note = window.prompt(t('pendingPaymentManagement.rejectionPrompt'));

    if (note === null) {
      return;
    }

    setProcessingId(payment.id);
    setMessage('');
    setError('');

    try {
      await paymentApi.rejectPayment(payment.id, { note: note || t('pendingPaymentManagement.rejectedNote') });
      setMessage(t('pendingPaymentManagement.rejected'));
      await loadPayments();
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('pendingPaymentManagement.rejectError'));
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
        {t('pendingPaymentManagement.approve')}
      </button>
      <button
        className="secondary-button compact-button"
        type="button"
        disabled={processingId === payment.id}
        onClick={() => handleReject(payment)}
      >
        {t('pendingPaymentManagement.reject')}
      </button>
    </div>
  );

  return (
    <section className="content-section">
      <PageHeader eyebrow={t('role.staff')} title={t('pendingPaymentManagement.title')} />

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('pendingPaymentManagement.loading')}</div>
      ) : (
        <PaymentTable payments={payments} renderActions={renderActions} />
      )}
    </section>
  );
}
