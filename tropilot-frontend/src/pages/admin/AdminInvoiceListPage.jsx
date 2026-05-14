import { useEffect, useState } from 'react';
import * as invoiceApi from '../../api/invoiceApi.js';
import * as roomApi from '../../api/roomApi.js';
import InvoiceDetail from '../../components/InvoiceDetail.jsx';
import InvoiceGenerateForm from '../../components/InvoiceGenerateForm.jsx';
import InvoiceTable from '../../components/InvoiceTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';

export default function AdminInvoiceListPage() {
  const [rooms, setRooms] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [loadingDetailId, setLoadingDetailId] = useState(null);

  const loadData = async () => {
    setError('');

    try {
      const [roomsResponse, invoicesResponse] = await Promise.all([
        roomApi.getAdminRooms(),
        invoiceApi.getAdminInvoices()
      ]);
      setRooms(roomsResponse.data);
      setInvoices(invoicesResponse.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Invoices could not be loaded');
    }
  };

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, []);

  const handleGenerate = async (payload) => {
    setGenerating(true);
    setMessage('');
    setError('');

    try {
      const response = await invoiceApi.generateInvoice(payload);
      setSelectedInvoice(response.data);
      setMessage('Invoice generated successfully.');
      await loadData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Invoice could not be generated');
      throw apiError;
    } finally {
      setGenerating(false);
    }
  };

  const handleView = async (invoice) => {
    setLoadingDetailId(invoice.id);
    setError('');

    try {
      const response = await invoiceApi.getAdminInvoice(invoice.id);
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
      <PageHeader eyebrow="Administrator" title="Invoices" />

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading invoices...</div>
      ) : (
        <section className="invoice-workspace">
          <div>
            <PageHeader eyebrow="Generate" title="New invoice" />
            <InvoiceGenerateForm rooms={rooms} loading={generating} onSubmit={handleGenerate} />
          </div>
          <div className="invoice-list-column">
            <InvoiceTable invoices={invoices} renderActions={renderActions} />
            <InvoiceDetail invoice={selectedInvoice} />
          </div>
        </section>
      )}
    </section>
  );
}
