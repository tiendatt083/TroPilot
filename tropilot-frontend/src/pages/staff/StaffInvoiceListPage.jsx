import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as invoiceApi from '../../api/invoiceApi.js';
import InvoiceDetail from '../../components/InvoiceDetail.jsx';
import InvoiceTable from '../../components/InvoiceTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';

export default function StaffInvoiceListPage() {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingDetailId, setLoadingDetailId] = useState(null);

  useEffect(() => {
    let active = true;

    invoiceApi
      .getStaffInvoices()
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

  const handleView = async (invoice) => {
    setLoadingDetailId(invoice.id);
    setError('');

    try {
      const response = await invoiceApi.getStaffInvoice(invoice.id);
      setSelectedInvoice(response.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Invoice could not be loaded');
    } finally {
      setLoadingDetailId(null);
    }
  };

  const renderActions = (invoice) => (
    <button
      className="secondary-button compact-button"
      type="button"
      disabled={loadingDetailId === invoice.id}
      onClick={() => handleView(invoice)}
    >
      View
    </button>
  );

  return (
    <section className="content-section">
      <div className="page-title-row">
        <PageHeader eyebrow="Operations staff" title="Invoices" />
        <Link className="button-link" to="/staff/invoices/generate">
          Generate invoice
        </Link>
      </div>

      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading invoices...</div>
      ) : (
        <section className="invoice-workspace">
          <InvoiceTable invoices={invoices} renderActions={renderActions} />
          <InvoiceDetail invoice={selectedInvoice} />
        </section>
      )}
    </section>
  );
}
