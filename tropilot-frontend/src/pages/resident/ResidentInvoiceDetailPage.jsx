import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as invoiceApi from '../../api/invoiceApi.js';
import InvoiceDetail from '../../components/InvoiceDetail.jsx';
import PageHeader from '../../components/PageHeader.jsx';

export default function ResidentInvoiceDetailPage() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    invoiceApi
      .getResidentInvoice(id)
      .then((response) => {
        if (active) {
          setInvoice(response.data);
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

  if (loading) {
    return <div className="empty-state">Loading invoice...</div>;
  }

  return (
    <section className="content-section">
      <div className="page-title-row">
        <PageHeader eyebrow="Head resident" title="Invoice details" />
        <Link className="secondary-link" to="/resident/invoices">
          Back to invoices
        </Link>
      </div>

      {error && <div className="alert error-alert">{error}</div>}
      <InvoiceDetail invoice={invoice} />
    </section>
  );
}
