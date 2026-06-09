import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import * as invoiceApi from '../api/invoiceApi.js';
import * as roomApi from '../api/roomApi.js';
import useInvoicePaymentPolling from '../hooks/useInvoicePaymentPolling.js';
import { formatDisplayDate, formatDisplayMonth } from '../utils/dateFormat.js';
import { formatInvoiceAmount, formatInvoiceText } from '../utils/invoiceDisplay.js';
import { isOccupiedRoom } from '../utils/roomEligibility.js';
import { formatRoomCode, formatRoomLabel } from '../utils/roomDisplay.js';
import InvoiceDetail from './InvoiceDetail.jsx';
import InvoiceTable from './InvoiceTable.jsx';
import PageHeader from './PageHeader.jsx';

function getLocalDateInputValue(date = new Date()) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function getDefaultDueDate(invoiceDateValue) {
  if (!invoiceDateValue) {
    return '';
  }

  const [year, month, day] = invoiceDateValue.split('-').map(Number);
  const dueDateMonth = day > 5 ? month : month - 1;
  const dueDate = new Date(year, dueDateMonth, 5);
  return getLocalDateInputValue(dueDate);
}

function canDeleteInvoice(invoice) {
  return ['UNPAID', 'PENDING_CONFIRMATION', 'OVERDUE', 'REJECTED'].includes(invoice?.status);
}

function createInitialForm() {
  const invoiceDate = getLocalDateInputValue();

  return {
    roomId: '',
    invoiceDate,
    dueDate: getDefaultDueDate(invoiceDate)
  };
}

function PreviewPanel({ preview }) {
  const { t } = useTranslation();

  if (!preview) {
    return <div className="empty-state">{t('buildingInvoices.previewEmpty')}</div>;
  }

  const warnings = [];

  if (preview.firstInvoiceForCurrentHead) {
    warnings.push(t('buildingInvoices.warnings.firstInvoice'));
  }

  if (preview.utilityReadingRequired) {
    warnings.push(t('buildingInvoices.warnings.previousMonthUtility'));
  }

  return (
    <section className="invoice-preview-panel">
      <div className="invoice-preview-header">
        <div>
          <span>{t('buildingInvoices.previewEyebrow')}</span>
          <h2>{t('buildingInvoices.previewTitle')}</h2>
        </div>
        <strong>{formatInvoiceAmount(preview.totalAmount)}</strong>
      </div>

      <div className="detail-panel compact-detail-panel">
        <div>
          <span>{t('tables.common.room')}</span>
          <strong>{formatRoomLabel(preview)}</strong>
        </div>
        <div>
          <span>{t('tables.common.headResident')}</span>
          <strong>{preview.residentHeadName}</strong>
        </div>
        <div>
          <span>{t('buildingInvoices.invoiceDate')}</span>
          <strong>{formatDisplayDate(preview.invoiceDate)}</strong>
        </div>
        <div>
          <span>{t('tables.common.month')}</span>
          <strong>{formatDisplayMonth(preview.invoiceMonth)}</strong>
        </div>
        <div>
          <span>{t('buildingInvoices.utilityMonth')}</span>
          <strong>{formatDisplayMonth(preview.utilityMonth)}</strong>
        </div>
        <div>
          <span>{t('tables.common.dueDate')}</span>
          <strong>{formatDisplayDate(preview.dueDate)}</strong>
        </div>
        <div>
          <span>{t('buildingInvoices.deposit')}</span>
          <strong>{preview.depositIncluded ? t('common.yes') : t('common.no')}</strong>
        </div>
        <div>
          <span>{t('buildingInvoices.utilityReading')}</span>
          <strong>{preview.utilityReadingRequired ? t('buildingInvoices.required') : t('common.notApplicable')}</strong>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="invoice-preview-notes">
          {warnings.map((warning) => (
            <span key={warning}>{warning}</span>
          ))}
        </div>
      )}

      <div className="table-wrap">
        <table className="data-table invoice-item-table">
          <thead>
            <tr>
              <th>{t('tables.common.item')}</th>
              <th>{t('tables.common.quantity')}</th>
              <th>{t('tables.common.unitPrice')}</th>
              <th>{t('tables.common.amount')}</th>
              <th>{t('tables.common.note')}</th>
            </tr>
          </thead>
          <tbody>
            {(preview.items || []).map((item) => (
              <tr key={`${item.itemName}-${item.amount}`}>
                <td>{formatInvoiceText(t, item.itemName)}</td>
                <td>{formatInvoiceAmount(item.quantity)}</td>
                <td>{formatInvoiceAmount(item.unitPrice)}</td>
                <td>{formatInvoiceAmount(item.amount)}</td>
                <td>{item.note ? formatInvoiceText(t, item.note) : t('common.notProvided')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function BulkPreviewPanel({ preview }) {
  const { t } = useTranslation();

  if (!preview) {
    return <div className="empty-state">{t('buildingInvoices.bulkPreviewEmpty')}</div>;
  }

  return (
    <section className="invoice-preview-panel">
      <div className="invoice-preview-header">
        <div>
          <span>{t('buildingInvoices.bulkPreviewEyebrow')}</span>
          <h2>{t('buildingInvoices.bulkPreviewTitle')}</h2>
        </div>
        <strong>{formatInvoiceAmount(preview.totalAmount)}</strong>
      </div>

      <div className="invoice-bulk-summary">
        <div>
          <span>{t('buildingInvoices.eligibleRooms')}</span>
          <strong>{preview.eligibleCount}</strong>
        </div>
        <div>
          <span>{t('buildingInvoices.blockedRooms')}</span>
          <strong>{preview.blockedCount}</strong>
        </div>
        <div>
          <span>{t('tables.common.month')}</span>
          <strong>{formatDisplayMonth(preview.invoiceMonth)}</strong>
        </div>
        <div>
          <span>{t('buildingInvoices.utilityMonth')}</span>
          <strong>{formatDisplayMonth(preview.utilityMonth)}</strong>
        </div>
      </div>

      <div className="invoice-bulk-columns">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('tables.common.room')}</th>
                <th>{t('tables.common.headResident')}</th>
                <th>{t('tables.common.totalAmount')}</th>
              </tr>
            </thead>
            <tbody>
              {(preview.eligibleInvoices || []).map((invoice) => (
                <tr key={invoice.roomId}>
                  <td>{formatRoomLabel(invoice)}</td>
                  <td>{invoice.residentHeadName}</td>
                  <td>{formatInvoiceAmount(invoice.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(preview.eligibleInvoices || []).length === 0 && (
            <div className="empty-state flat-empty-state">{t('buildingInvoices.noEligibleRooms')}</div>
          )}
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('tables.common.room')}</th>
                <th>{t('tables.common.note')}</th>
              </tr>
            </thead>
            <tbody>
              {(preview.blockedRooms || []).map((room) => (
                <tr key={`${room.roomId}-${room.reasonCode}`}>
                  <td>{formatRoomLabel(room)}</td>
                  <td>
                    {t(`buildingInvoices.blockReasons.${room.reasonCode}`, {
                      defaultValue: room.reason
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(preview.blockedRooms || []).length === 0 && (
            <div className="empty-state flat-empty-state">{t('buildingInvoices.noBlockedRooms')}</div>
          )}
        </div>
      </div>
    </section>
  );
}

export default function BuildingInvoiceWorkspace({ role = 'admin' }) {
  const { t } = useTranslation();
  const { building } = useOutletContext();
  const [rooms, setRooms] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [singlePreview, setSinglePreview] = useState(null);
  const [bulkPreview, setBulkPreview] = useState(null);
  const [mode, setMode] = useState('single');
  const [form, setForm] = useState(createInitialForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [loadingDetailId, setLoadingDetailId] = useState(null);

  const isAdmin = role === 'admin';
  const invoiceMonth = form.invoiceDate ? form.invoiceDate.slice(0, 7) : '';
  const invoicedRoomIdsForMonth = useMemo(() => {
    return new Set(
      invoices
        .filter((invoice) => invoice.month === invoiceMonth)
        .map((invoice) => invoice.roomId)
    );
  }, [invoices, invoiceMonth]);
  const availableRooms = useMemo(() => {
    return rooms.filter((room) => {
      return isOccupiedRoom(room) && !invoicedRoomIdsForMonth.has(room.id);
    });
  }, [rooms, invoicedRoomIdsForMonth]);

  const loadData = async () => {
    setError('');

    try {
      const [roomsResponse, invoicesResponse] = await Promise.all([
        isAdmin ? roomApi.getAdminRooms({ buildingId: building.id }) : roomApi.getStaffRooms({ buildingId: building.id }),
        isAdmin
          ? invoiceApi.getAdminBuildingInvoices(building.id)
          : invoiceApi.getStaffBuildingInvoices(building.id)
      ]);
      setRooms(roomsResponse.data);
      setInvoices(invoicesResponse.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('buildingInvoices.loadError'));
    }
  };

  useEffect(() => {
    setLoading(true);
    setSelectedInvoice(null);
    setSinglePreview(null);
    setBulkPreview(null);
    loadData().finally(() => setLoading(false));
  }, [building.id, role, t]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setSinglePreview(null);
    setBulkPreview(null);

    setForm((current) => {
      if (name === 'invoiceDate') {
        return {
          ...current,
          invoiceDate: value,
          dueDate: getDefaultDueDate(value)
        };
      }

      return {
        ...current,
        [name]: value
      };
    });
  };

  const getSinglePayload = () => ({
    roomId: Number(form.roomId),
    invoiceDate: form.invoiceDate,
    dueDate: form.dueDate
  });

  const getBulkPayload = () => ({
    invoiceDate: form.invoiceDate,
    dueDate: form.dueDate
  });

  const handlePreviewSingle = async (event) => {
    event.preventDefault();
    setProcessing(true);
    setMessage('');
    setError('');

    try {
      const response = isAdmin
        ? await invoiceApi.previewBuildingInvoice(building.id, getSinglePayload())
        : await invoiceApi.previewStaffBuildingInvoice(building.id, getSinglePayload());
      setSinglePreview(response.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('buildingInvoices.previewError'));
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerateSingle = async () => {
    setProcessing(true);
    setMessage('');
    setError('');

    try {
      const response = isAdmin
        ? await invoiceApi.generateBuildingInvoice(building.id, getSinglePayload())
        : await invoiceApi.generateStaffBuildingInvoice(building.id, getSinglePayload());
      setSelectedInvoice(response.data);
      setSinglePreview(null);
      setForm(createInitialForm());
      setMessage(t('buildingInvoices.generated'));
      await loadData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('buildingInvoices.generateError'));
    } finally {
      setProcessing(false);
    }
  };

  const handlePreviewBulk = async () => {
    setProcessing(true);
    setMessage('');
    setError('');

    try {
      const response = isAdmin
        ? await invoiceApi.previewBuildingBulkInvoices(building.id, getBulkPayload())
        : await invoiceApi.previewStaffBuildingBulkInvoices(building.id, getBulkPayload());
      setBulkPreview(response.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('buildingInvoices.bulkPreviewError'));
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerateBulk = async () => {
    setProcessing(true);
    setMessage('');
    setError('');

    try {
      const response = isAdmin
        ? await invoiceApi.generateBuildingBulkInvoices(building.id, getBulkPayload())
        : await invoiceApi.generateStaffBuildingBulkInvoices(building.id, getBulkPayload());
      setBulkPreview(null);
      setMessage(t('buildingInvoices.bulkGenerated', { count: response.data.length }));
      await loadData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('buildingInvoices.bulkGenerateError'));
    } finally {
      setProcessing(false);
    }
  };

  const loadInvoiceDetail = async (invoiceId) => {
    return isAdmin
      ? invoiceApi.getAdminBuildingInvoice(building.id, invoiceId)
      : invoiceApi.getStaffBuildingInvoice(building.id, invoiceId);
  };

  const handleView = async (invoice) => {
    setLoadingDetailId(invoice.id);
    setError('');

    try {
      const response = await loadInvoiceDetail(invoice.id);
      setSelectedInvoice(response.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('buildingInvoices.invoiceLoadError'));
    } finally {
      setLoadingDetailId(null);
    }
  };

  const handleDelete = async (invoice) => {
    if (!isAdmin || !window.confirm(t('buildingInvoices.deleteConfirm', { room: formatRoomCode(invoice), month: formatDisplayMonth(invoice.month) }))) {
      return;
    }

    setProcessing(true);
    setMessage('');
    setError('');

    try {
      await invoiceApi.deleteBuildingInvoice(building.id, invoice.id);
      setSelectedInvoice((current) => (current?.id === invoice.id ? null : current));
      setMessage(t('buildingInvoices.deleted'));
      await loadData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('buildingInvoices.deleteError'));
    } finally {
      setProcessing(false);
    }
  };

  const fetchSelectedInvoice = useCallback(() => {
    return loadInvoiceDetail(selectedInvoice.id);
  }, [building.id, role, selectedInvoice?.id]);

  const handleInvoicePollingUpdate = useCallback((updatedInvoice) => {
    setSelectedInvoice(updatedInvoice);
    setInvoices((current) => current.map((invoice) => (
      invoice.id === updatedInvoice.id ? { ...invoice, ...updatedInvoice } : invoice
    )));
  }, []);

  useInvoicePaymentPolling({
    invoice: selectedInvoice,
    fetchInvoice: fetchSelectedInvoice,
    onInvoiceUpdate: handleInvoicePollingUpdate
  });

  const renderActions = (invoice) => (
    <div className="table-action-group">
      <button
        className="secondary-button compact-button"
        type="button"
        disabled={loadingDetailId === invoice.id}
        onClick={() => handleView(invoice)}
      >
        {t('common.view')}
      </button>
      {isAdmin && canDeleteInvoice(invoice) && (
        <button
          className="danger-button compact-button"
          type="button"
          disabled={processing}
          onClick={() => handleDelete(invoice)}
        >
          {t('common.delete')}
        </button>
      )}
    </div>
  );

  return (
    <div className="building-workspace">
      <PageHeader eyebrow={t('buildingInvoices.eyebrow')} title={t('buildingInvoices.title')} />
      <p className="page-support-text">{t('buildingInvoices.description')}</p>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('buildingInvoices.loading')}</div>
      ) : (
        <section className="invoice-management-workspace">
          <div className="invoice-command-panel">
            <div className="segmented-control">
              <button className={mode === 'single' ? 'active' : ''} type="button" onClick={() => setMode('single')}>
                {t('buildingInvoices.singleRoom')}
              </button>
              <button className={mode === 'bulk' ? 'active' : ''} type="button" onClick={() => setMode('bulk')}>
                {t('buildingInvoices.bulk')}
              </button>
            </div>

            <form className="panel-form" onSubmit={handlePreviewSingle}>
              <div className="form-grid">
                <label htmlFor="invoiceDate">{t('buildingInvoices.invoiceDate')}</label>
                <input
                  id="invoiceDate"
                  name="invoiceDate"
                  type="date"
                  lang="en-GB"
                  value={form.invoiceDate}
                  onChange={handleFormChange}
                  required
                />

                <label htmlFor="dueDate">{t('tables.common.dueDate')}</label>
                <input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  lang="en-GB"
                  value={form.dueDate}
                  onChange={handleFormChange}
                  required
                />

                {mode === 'single' && (
                  <>
                    <label htmlFor="roomId">{t('tables.common.room')}</label>
                    <select id="roomId" name="roomId" value={form.roomId} onChange={handleFormChange} required>
                      <option value="">{t('forms.utilityReading.selectRoom')}</option>
                      {availableRooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {formatRoomLabel(room)}
                        </option>
                      ))}
                    </select>
                    <button type="submit" disabled={processing || !form.roomId}>
                      {processing ? t('buildingInvoices.previewing') : t('buildingInvoices.preview')}
                    </button>
                  </>
                )}
              </div>
            </form>

            {mode === 'bulk' && (
              <button className="primary-action-button" type="button" disabled={processing} onClick={handlePreviewBulk}>
                {processing ? t('buildingInvoices.previewing') : t('buildingInvoices.previewBulk')}
              </button>
            )}

            {mode === 'single' ? (
              <button
                className="primary-action-button"
                type="button"
                disabled={processing || !singlePreview}
                onClick={handleGenerateSingle}
              >
                {processing ? t('forms.invoice.generating') : t('forms.invoice.generate')}
              </button>
            ) : (
              <button
                className="primary-action-button"
                type="button"
                disabled={processing || !bulkPreview || bulkPreview.eligibleCount === 0}
                onClick={handleGenerateBulk}
              >
                {processing ? t('forms.invoice.generating') : t('buildingInvoices.generateBulk')}
              </button>
            )}
          </div>

          <div className="invoice-preview-column">
            {mode === 'single' ? <PreviewPanel preview={singlePreview} /> : <BulkPreviewPanel preview={bulkPreview} />}
          </div>

          <div className="invoice-list-column">
            <PageHeader eyebrow={t('buildingInvoices.invoiceRecords')} title={t('buildingInvoices.createdInvoices')} />
            <InvoiceTable invoices={invoices} renderActions={renderActions} />
            <InvoiceDetail invoice={selectedInvoice} />
          </div>
        </section>
      )}
    </div>
  );
}
