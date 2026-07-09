import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import * as invoiceApi from '../../features/invoices/api.js';
import * as paymentApi from '../../features/payments/api.js';
import { InvoiceDetail } from '../../features/invoices/components/index.js';
import PageHeader from '../../components/PageHeader.jsx';
import { PaymentProofUploadForm, PaymentTable } from '../../features/payments/components/index.js';
import useInvoicePaymentPolling from '../../hooks/useInvoicePaymentPolling.js';

export default function ResidentInvoiceDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [payments, setPayments] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadData = async () => {
    const [invoiceResponse, paymentsResponse] = await Promise.all([
      invoiceApi.getResidentInvoice(id),
      paymentApi.getResidentPayments()
    ]);

    setInvoice(invoiceResponse.data);
    setPayments(paymentsResponse.data.filter((payment) => payment.invoiceId === Number(id)));
  };

  const fetchCurrentInvoice = useCallback(() => {
    return invoiceApi.getResidentInvoice(id);
  }, [id]);

  const handleInvoicePollingUpdate = useCallback((updatedInvoice) => {
    setInvoice(updatedInvoice);
  }, []);

  useInvoicePaymentPolling({
    invoice,
    fetchInvoice: fetchCurrentInvoice,
    onInvoiceUpdate: handleInvoicePollingUpdate
  });

  useEffect(() => {
    let active = true;

    loadData()
      .then(() => {
        if (active) {
          setError('');
        }
      })
      .catch((apiError) => {
        if (active) {
          setError(apiError.response?.data?.message || t('resident.invoices.detailLoadError'));
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
  }, [id]);

  const handlePaymentUpload = async (payload) => {
    setUploading(true);
    setMessage('');
    setError('');

    try {
      await paymentApi.uploadPaymentProof(payload);
      await loadData();
      setMessage(t('resident.invoices.proofUploaded'));
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('resident.invoices.proofUploadError'));
      throw apiError;
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="empty-state">{t('resident.invoices.loadingDetail')}</div>;
  }

  const canUploadPayment = invoice && ['UNPAID', 'REJECTED'].includes(invoice.status);

  return (
    <section className="content-section">
      <div className="page-title-row">
        <PageHeader eyebrow={t('resident.eyebrow')} title={t('resident.invoices.details')} />
        <Link className="secondary-link" to="/resident/invoices">
          {t('resident.invoices.back')}
        </Link>
      </div>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      <section className="resident-invoice-workspace">
        <InvoiceDetail invoice={invoice} showPaymentInstructions />

        {invoice && (
          <div className="payment-panel">
            <PageHeader eyebrow={t('resident.invoices.paymentEyebrow')} title={t('resident.invoices.paymentProof')} />
            {canUploadPayment ? (
              <PaymentProofUploadForm invoiceId={invoice.id} loading={uploading} onSubmit={handlePaymentUpload} />
            ) : (
              <div className="empty-state">
                {t('resident.invoices.proofUnavailable')}
              </div>
            )}
          </div>
        )}

        <div className="payment-panel">
          <PageHeader eyebrow={t('resident.invoices.paymentEyebrow')} title={t('resident.invoices.paymentStatus')} />
          <PaymentTable payments={payments} />
        </div>
      </section>
    </section>
  );
}
