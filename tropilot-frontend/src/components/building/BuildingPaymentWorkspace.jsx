import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import * as paymentApi from '../../features/payments/api.js';
import PaymentTable from '../PaymentTable.jsx';

export default function BuildingPaymentWorkspace() {
  const { t } = useTranslation();
  const { building } = useOutletContext();
  const [payments, setPayments] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const buildingFilter = { buildingId: building.id };

  const loadPayments = async () => {
    setError('');

    try {
      const response = await paymentApi.getPendingPayments(buildingFilter);
      setPayments(response.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('workspace.payments.loadError'));
    }
  };

  useEffect(() => {
    setLoading(true);
    loadPayments().finally(() => setLoading(false));
  }, [building.id]);

  const handleApprove = async (payment) => {
    setProcessingId(payment.id);
    setMessage('');
    setError('');

    try {
      await paymentApi.approvePayment(payment.id, { note: t('workspace.payments.approvedNote') }, buildingFilter);
      setMessage(t('workspace.payments.approved'));
      await loadPayments();
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('workspace.payments.approveError'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (payment) => {
    const note = window.prompt(t('workspace.payments.rejectPrompt'));
    if (note === null) {
      return;
    }

    setProcessingId(payment.id);
    setMessage('');
    setError('');

    try {
      await paymentApi.rejectPayment(payment.id, { note: note || t('workspace.payments.rejectedNote') }, buildingFilter);
      setMessage(t('workspace.payments.rejected'));
      await loadPayments();
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('workspace.payments.rejectError'));
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
        {t('workspace.payments.approve')}
      </button>
      <button
        className="secondary-button compact-button"
        type="button"
        disabled={processingId === payment.id}
        onClick={() => handleReject(payment)}
      >
        {t('workspace.payments.reject')}
      </button>
    </div>
  );

  return (
    <div className="building-workspace">
      <div className="building-section-header">
        <span className="page-eyebrow">{t('workspace.payments.eyebrow')}</span>
      </div>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('workspace.payments.loading')}</div>
      ) : (
        <PaymentTable payments={payments} renderActions={renderActions} />
      )}
    </div>
  );
}
