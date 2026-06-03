import { useCallback, useEffect, useState } from 'react';
import * as feedbackApi from '../../api/feedbackApi.js';
import { Link, useParams } from 'react-router-dom';
import * as invoiceApi from '../../api/invoiceApi.js';
import * as paymentApi from '../../api/paymentApi.js';
import InvoiceDetail from '../../components/InvoiceDetail.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import PaymentProofUploadForm from '../../components/PaymentProofUploadForm.jsx';
import PaymentTable from '../../components/PaymentTable.jsx';
import useInvoicePaymentPolling from '../../hooks/useInvoicePaymentPolling.js';

export default function ResidentInvoiceDetailPage() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [payments, setPayments] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [complaining, setComplaining] = useState(false);
  const [complaintForm, setComplaintForm] = useState({
    title: '',
    content: ''
  });

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
          setError(apiError.response?.data?.message || 'Invoice could not be loaded');
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
      setMessage('Payment proof uploaded successfully.');
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Payment proof could not be uploaded');
      throw apiError;
    } finally {
      setUploading(false);
    }
  };

  const handleComplaintChange = (event) => {
    const { name, value } = event.target;
    setComplaintForm((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleComplaintSubmit = async (event) => {
    event.preventDefault();
    setComplaining(true);
    setMessage('');
    setError('');

    try {
      await feedbackApi.createInvoiceComplaint(invoice.id, complaintForm);
      setComplaintForm({ title: '', content: '' });
      setComplaintOpen(false);
      setMessage('Invoice complaint submitted successfully.');
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Invoice complaint could not be submitted');
    } finally {
      setComplaining(false);
    }
  };

  if (loading) {
    return <div className="empty-state">Loading invoice...</div>;
  }

  const canUploadPayment = invoice && ['UNPAID', 'REJECTED'].includes(invoice.status);

  return (
    <section className="content-section">
      <div className="page-title-row">
        <PageHeader eyebrow="Head resident" title="Invoice details" />
        <Link className="secondary-link" to="/resident/invoices">
          Back to invoices
        </Link>
      </div>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      <section className="resident-invoice-workspace">
        <InvoiceDetail invoice={invoice} />

        {invoice && (
          <div className="payment-panel">
            <div className="page-title-row compact-title-row">
              <PageHeader eyebrow="Complaint" title="Invoice complaint" />
              <button
                className="secondary-button inline-button"
                type="button"
                onClick={() => setComplaintOpen((current) => !current)}
              >
                {complaintOpen ? 'Close complaint form' : 'Complain about invoice'}
              </button>
            </div>

            {complaintOpen && (
              <form className="panel-form" onSubmit={handleComplaintSubmit}>
                <label htmlFor="complaintTitle">Complaint title</label>
                <input
                  id="complaintTitle"
                  name="title"
                  value={complaintForm.title}
                  onChange={handleComplaintChange}
                  maxLength={160}
                  required
                />

                <label htmlFor="complaintContent">Complaint content</label>
                <textarea
                  id="complaintContent"
                  name="content"
                  rows="5"
                  value={complaintForm.content}
                  onChange={handleComplaintChange}
                  required
                />

                <button type="submit" disabled={complaining}>
                  {complaining ? 'Submitting...' : 'Submit complaint'}
                </button>
              </form>
            )}
          </div>
        )}

        {invoice && (
          <div className="payment-panel">
            <PageHeader eyebrow="Payment" title="Payment proof" />
            {canUploadPayment ? (
              <PaymentProofUploadForm invoiceId={invoice.id} loading={uploading} onSubmit={handlePaymentUpload} />
            ) : (
              <div className="empty-state">
                Payment proof can only be uploaded when the invoice is unpaid or rejected.
              </div>
            )}
          </div>
        )}

        <div className="payment-panel">
          <PageHeader eyebrow="Payment" title="Payment status" />
          <PaymentTable payments={payments} />
        </div>
      </section>
    </section>
  );
}
