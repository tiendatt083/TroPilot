import { useEffect, useState } from 'react';
import * as invoiceApi from '../../api/invoiceApi.js';
import InvoiceTable from '../../components/InvoiceTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';

export default function ResidentInvoiceListPage() {
  const [invoices, setInvoices] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    invoiceApi
      .getResidentInvoices()
      .then((response) => {
        if (active) {
          setInvoices(response.data);
        }
      })
      .catch((apiError) => {
        if (active) {
          setError(apiError.response?.data?.message || 'Invoices could not be loaded');
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
      <PageHeader eyebrow="Head resident" title="Invoices" />

      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading invoices...</div>
      ) : (
        <InvoiceTable invoices={invoices} detailPathBase="/resident/invoices" />
      )}
    </section>
  );
}
