import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import * as invoiceApi from '../features/invoices/api.js';
import * as roomApi from '../features/rooms/api.js';
import useInvoicePaymentPolling from '../hooks/useInvoicePaymentPolling.js';
import { formatDateInputValue, formatDisplayDate, formatDisplayMonth } from '../utils/dateFormat.js';
import { formatInvoiceAmount, formatInvoiceText } from '../utils/invoiceDisplay.js';
import { formatEnumLabel } from '../utils/i18nFormat.js';
import { exportRowsToExcel } from '../utils/excelExport.js';
import { isOccupiedRoom } from '../utils/roomEligibility.js';
import { formatRoomCode, formatRoomLabel } from '../utils/roomDisplay.js';
import InvoiceDetail from './InvoiceDetail.jsx';
import InvoiceTable, { formatInvoiceCode } from './InvoiceTable.jsx';

const INVOICE_STATUS_FILTERS = [
  'ALL',
  'UNPAID',
  'PAID',
  'OVERDUE',
  'PENDING_CONFIRMATION',
  'REJECTED'
];

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function getDefaultDueDate(invoiceDateValue) {
  if (!invoiceDateValue) {
    return '';
  }

  const [year, month, day] = invoiceDateValue.split('-').map(Number);
  const dueDateMonth = day > 5 ? month : month - 1;
  const dueDate = new Date(year, dueDateMonth, 5);
  return formatDateInputValue(dueDate);
}

function canDeleteInvoice(invoice) {
  return ['UNPAID', 'PENDING_CONFIRMATION', 'OVERDUE', 'REJECTED'].includes(invoice?.status);
}

function invoiceMatchesSearch(invoice, searchValue, t) {
  if (!searchValue) {
    return true;
  }

  return [
    invoice.id,
    formatInvoiceCode(invoice),
    formatRoomCode(invoice),
    formatRoomLabel(invoice),
    invoice.roomName,
    invoice.buildingCode,
    invoice.buildingName,
    invoice.residentHeadName,
    invoice.residentHeadEmail,
    invoice.month,
    invoice.dueDate,
    invoice.totalAmount,
    formatEnumLabel(t, 'invoiceStatus', invoice.status)
  ].some((value) => normalize(value).includes(searchValue));
}

function getInvoiceTime(invoice) {
  const dateValue = invoice.createdAt || invoice.invoiceDate || invoice.dueDate || invoice.month;
  const time = Date.parse(dateValue);
  return Number.isFinite(time) ? time : 0;
}

function buildExportFileName(building) {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const buildingCode = String(building?.buildingCode || building?.code || 'building')
    .trim()
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

  return `tropilot-${buildingCode || 'building'}-invoices-${day}-${month}-${year}.xlsx`;
}

function createInitialForm() {
  const invoiceDate = formatDateInputValue();

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
  const [composerOpen, setComposerOpen] = useState(false);
  const [mode, setMode] = useState('single');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [sortDirection, setSortDirection] = useState('desc');
  const [form, setForm] = useState(createInitialForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
  const filteredInvoices = useMemo(() => {
    const searchValue = normalize(search);

    return [...invoices]
      .filter((invoice) => statusFilter === 'ALL' || invoice.status === statusFilter)
      .filter((invoice) => invoiceMatchesSearch(invoice, searchValue, t))
      .sort((left, right) => {
        const result = getInvoiceTime(right) - getInvoiceTime(left)
          || Number(right.id || 0) - Number(left.id || 0);

        return sortDirection === 'desc' ? result : -result;
      });
  }, [invoices, search, sortDirection, statusFilter, t]);

  useEffect(() => {
    if (!form.roomId) {
      return;
    }

    const selectedRoomStillAvailable = availableRooms.some((room) => String(room.id) === String(form.roomId));
    if (!selectedRoomStillAvailable) {
      setForm((current) => ({ ...current, roomId: '' }));
      setSinglePreview(null);
    }
  }, [availableRooms, form.roomId]);

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

  const handleOpenComposer = (nextMode) => {
    setMode(nextMode);
    setComposerOpen(true);
    setSinglePreview(null);
    setBulkPreview(null);
    setMessage('');
    setError('');
  };

  const handleCloseComposer = () => {
    if (processing) {
      return;
    }

    setComposerOpen(false);
    setSinglePreview(null);
    setBulkPreview(null);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleClearInvoiceFilters = () => {
    setStatusFilter('ALL');
    setSearch('');
    setSortDirection('desc');
  };

  const handleExport = () => {
    setMessage('');
    setError('');

    if (filteredInvoices.length === 0) {
      setError(t('buildingInvoices.exportEmpty'));
      return;
    }

    const rows = filteredInvoices.map((invoice) => ({
      [t('buildingInvoices.columns.id')]: invoice.id,
      [t('buildingInvoices.columns.invoiceNumber')]: formatInvoiceCode(invoice),
      [t('buildingInvoices.columns.apartment')]: formatRoomLabel(invoice) || formatRoomCode(invoice),
      [t('tables.common.headResident')]: invoice.residentHeadName || t('common.notProvided'),
      [t('tables.common.month')]: formatDisplayMonth(invoice.month, t('common.notProvided')),
      [t('tables.common.dueDate')]: formatDisplayDate(invoice.dueDate, t('common.notProvided')),
      [t('tables.common.status')]: formatEnumLabel(t, 'invoiceStatus', invoice.status),
      [t('tables.common.totalAmount')]: invoice.totalAmount || 0
    }));

    exportRowsToExcel({
      rows,
      fileName: buildExportFileName(building),
      sheetName: t('buildingInvoices.export.sheetName')
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
      setComposerOpen(false);
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
      setComposerOpen(false);
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
    <div className="table-action-group icon-table-actions">
      <button
        aria-label={t('common.view')}
        className="icon-action-button"
        data-tooltip={loadingDetailId === invoice.id ? t('buildingInvoices.actions.loadingDetail') : t('common.view')}
        type="button"
        disabled={loadingDetailId === invoice.id}
        onClick={() => handleView(invoice)}
      >
        <EyeIcon />
      </button>
      {isAdmin && canDeleteInvoice(invoice) && (
        <button
          aria-label={t('common.delete')}
          className="icon-action-button icon-action-danger"
          data-tooltip={t('common.delete')}
          type="button"
          disabled={processing}
          onClick={() => handleDelete(invoice)}
        >
          <TrashIcon />
        </button>
      )}
    </div>
  );

  return (
    <div className="building-workspace invoice-modern-page">
      <section className="invoice-page-hero">
        <div>
          <h1>{t('buildingInvoices.managementTitle')}</h1>
          <p>{t('buildingInvoices.managementSummary', { count: invoices.length })}</p>
        </div>
        <div className="invoice-hero-actions">
          <button className="invoice-hero-button invoice-hero-button-primary" type="button" onClick={() => handleOpenComposer('single')}>
            <PlusIcon />
            {t('buildingInvoices.actions.createSingle')}
          </button>
          <button className="invoice-hero-button invoice-hero-button-accent" type="button" onClick={() => handleOpenComposer('bulk')}>
            <PlusIcon />
            {t('buildingInvoices.actions.createBulk')}
          </button>
          <button className="invoice-hero-button invoice-hero-button-success" type="button" onClick={handleExport}>
            <DownloadIcon />
            {t('buildingInvoices.actions.exportExcel')}
          </button>
        </div>
      </section>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {composerOpen && (
        <section className="invoice-composer-panel">
          <div className="invoice-composer-header">
            <div>
              <span className="section-eyebrow">
                {mode === 'single' ? t('buildingInvoices.singleRoom') : t('buildingInvoices.bulk')}
              </span>
              <h2>{mode === 'single' ? t('buildingInvoices.actions.createSingle') : t('buildingInvoices.actions.createBulk')}</h2>
            </div>
            <button className="secondary-button inline-button" type="button" onClick={handleCloseComposer}>
              {t('common.close')}
            </button>
          </div>

          <div className="invoice-composer-grid">
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
          </div>
        </section>
      )}

      {loading ? (
        <div className="empty-state">{t('buildingInvoices.loading')}</div>
      ) : (
        <section className="invoice-record-section">
          <div className="invoice-filter-panel">
            <div className="invoice-status-filter">
              <label htmlFor="invoiceStatusFilter">{t('buildingInvoices.filters.statusLabel')}</label>
              <select
                id="invoiceStatusFilter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                {INVOICE_STATUS_FILTERS.map((status) => (
                  <option key={status} value={status}>
                    {status === 'ALL'
                      ? t('buildingInvoices.filters.allStatuses')
                      : formatEnumLabel(t, 'invoiceStatus', status)}
                  </option>
                ))}
              </select>
            </div>

            <div className="invoice-search-tools">
              <div className="invoice-search-field">
                <SearchIcon />
                <input
                  aria-label={t('buildingInvoices.filters.searchAria')}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t('buildingInvoices.filters.searchPlaceholder')}
                />
              </div>
              <button
                className="secondary-button inline-button invoice-sort-button"
                type="button"
                onClick={() => setSortDirection((current) => (current === 'desc' ? 'asc' : 'desc'))}
              >
                {sortDirection === 'desc' ? <ArrowDownIcon /> : <ArrowUpIcon />}
                {sortDirection === 'desc' ? t('buildingInvoices.filters.newest') : t('buildingInvoices.filters.oldest')}
              </button>
              <button
                aria-label={t('buildingInvoices.actions.refresh')}
                className="secondary-button inline-button invoice-refresh-button"
                type="button"
                disabled={refreshing}
                onClick={handleRefresh}
              >
                <RefreshIcon />
              </button>
              <button className="secondary-button inline-button" type="button" onClick={handleClearInvoiceFilters}>
                {t('common.clear')}
              </button>
            </div>
          </div>

          <InvoiceTable invoices={filteredInvoices} renderActions={renderActions} />
          {selectedInvoice && <InvoiceDetail invoice={selectedInvoice} />}
        </section>
      )}
    </div>
  );
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m21 21-4.4-4.4" />
      <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 5v14" />
      <path d="m7 14 5 5 5-5" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 19V5" />
      <path d="m7 10 5-5 5 5" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M21 12a9 9 0 0 1-15.2 6.5" />
      <path d="M3 12A9 9 0 0 1 18.2 5.5" />
      <path d="M18 2v4h-4" />
      <path d="M6 22v-4h4" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" />
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M6 7l1 14h10l1-14" />
      <path d="M9 7V4h6v3" />
    </svg>
  );
}
