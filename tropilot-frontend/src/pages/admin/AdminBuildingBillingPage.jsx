import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import * as invoiceApi from '../../api/invoiceApi.js';
import * as roomApi from '../../api/roomApi.js';
import * as utilityReadingApi from '../../api/utilityReadingApi.js';
import InvoiceDetail from '../../components/InvoiceDetail.jsx';
import InvoiceGenerateForm from '../../components/InvoiceGenerateForm.jsx';
import InvoiceTable from '../../components/InvoiceTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import UtilityReadingForm from '../../components/UtilityReadingForm.jsx';
import UtilityReadingTable from '../../components/UtilityReadingTable.jsx';
import { formatDisplayMonth } from '../../utils/dateFormat.js';
import { formatRoomCode } from '../../utils/roomDisplay.js';

export default function AdminBuildingBillingPage() {
  const { t } = useTranslation();
  const { building } = useOutletContext();
  const [rooms, setRooms] = useState([]);
  const [readings, setReadings] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [editingReading, setEditingReading] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingReading, setSavingReading] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [loadingDetailId, setLoadingDetailId] = useState(null);
  const [formKey, setFormKey] = useState(0);

  const loadData = async () => {
    setError('');

    try {
      const [roomsResponse, readingsResponse, invoicesResponse] = await Promise.all([
        roomApi.getAdminRooms({ buildingId: building.id }),
        utilityReadingApi.getAdminUtilityReadings({ buildingId: building.id }),
        invoiceApi.getAdminInvoices({ buildingId: building.id })
      ]);

      setRooms(roomsResponse.data);
      setReadings(readingsResponse.data);
      setInvoices(invoicesResponse.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('buildingBilling.loadError'));
    }
  };

  useEffect(() => {
    setLoading(true);
    setEditingReading(null);
    setSelectedInvoice(null);
    loadData().finally(() => setLoading(false));
  }, [building.id]);

  const handleCreateReading = async (payload) => {
    setSavingReading(true);
    setMessage('');
    setError('');

    try {
      await utilityReadingApi.createUtilityReading({
        ...payload,
        buildingId: building.id
      });
      setMessage(t('buildingBilling.readingCreated'));
      setFormKey((current) => current + 1);
      await loadData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('buildingBilling.readingCreateError'));
    } finally {
      setSavingReading(false);
    }
  };

  const handleUpdateReading = async (payload) => {
    setSavingReading(true);
    setMessage('');
    setError('');

    try {
      await utilityReadingApi.updateAdminUtilityReading(editingReading.id, {
        ...payload,
        buildingId: building.id
      });
      setMessage(t('buildingBilling.readingUpdated'));
      setEditingReading(null);
      await loadData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('buildingBilling.readingUpdateError'));
    } finally {
      setSavingReading(false);
    }
  };

  const handleGenerateInvoice = async (payload) => {
    setGeneratingInvoice(true);
    setMessage('');
    setError('');

    try {
      const response = await invoiceApi.generateInvoice({
        ...payload,
        buildingId: building.id
      });
      setSelectedInvoice(response.data);
      setMessage(t('buildingBilling.invoiceGenerated'));
      await loadData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('buildingBilling.invoiceGenerateError'));
      throw apiError;
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const handleViewInvoice = async (invoice) => {
    setLoadingDetailId(invoice.id);
    setError('');

    try {
      const response = await invoiceApi.getAdminInvoice(invoice.id, { buildingId: building.id });
      setSelectedInvoice(response.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('buildingBilling.invoiceLoadError'));
    } finally {
      setLoadingDetailId(null);
    }
  };

  const renderReadingActions = (reading) => (
    <div className="table-actions">
      <button className="secondary-button compact-button" type="button" onClick={() => setEditingReading(reading)}>
        {t('common.edit')}
      </button>
    </div>
  );

  const renderInvoiceActions = (invoice) => (
    <button
      className="secondary-button compact-button"
      type="button"
      disabled={loadingDetailId === invoice.id}
      onClick={() => handleViewInvoice(invoice)}
    >
      {t('common.view')}
    </button>
  );

  return (
    <div className="building-workspace">
      <PageHeader eyebrow={t('buildingBilling.eyebrow')} title={t('buildingBilling.title')} />
      <p className="page-support-text">{t('buildingBilling.description')}</p>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('buildingBilling.loading')}</div>
      ) : (
        <section className="building-billing-workspace">
          <div className="billing-form-stack">
            <section className="building-section">
              <PageHeader
                eyebrow={editingReading ? t('buildingBilling.editReading') : t('buildingBilling.readingEntry')}
                title={
                  editingReading
                    ? `${formatRoomCode(editingReading)} - ${formatDisplayMonth(editingReading.month)}`
                    : t('buildingBilling.recordReading')
                }
              />
              <UtilityReadingForm
                key={editingReading?.id || `new-building-reading-${building.id}-${formKey}`}
                rooms={rooms}
                readings={readings}
                initialValues={editingReading}
                loading={savingReading}
                mode={editingReading ? 'edit' : 'create'}
                submitLabel={editingReading ? t('buildingBilling.saveChanges') : t('buildingBilling.recordReading')}
                onSubmit={editingReading ? handleUpdateReading : handleCreateReading}
                onCancel={editingReading ? () => setEditingReading(null) : undefined}
              />
            </section>

            <section className="building-section">
              <PageHeader eyebrow={t('buildingBilling.invoiceGeneration')} title={t('buildingBilling.newInvoice')} />
              <InvoiceGenerateForm rooms={rooms} loading={generatingInvoice} onSubmit={handleGenerateInvoice} />
            </section>
          </div>

          <div className="billing-data-stack">
            <section className="building-section">
              <PageHeader eyebrow={t('buildingBilling.billingRecords')} title={t('buildingBilling.utilityReadings')} />
              <UtilityReadingTable readings={readings} renderActions={renderReadingActions} />
            </section>

            <section className="building-section">
              <PageHeader eyebrow={t('buildingBilling.billingRecords')} title={t('buildingBilling.invoices')} />
              <InvoiceTable invoices={invoices} renderActions={renderInvoiceActions} />
              <InvoiceDetail invoice={selectedInvoice} />
            </section>
          </div>
        </section>
      )}
    </div>
  );
}
