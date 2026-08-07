import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import * as invoiceApi from '../api/invoiceApi.js';
import * as roomApi from '../api/roomApi.js';
import useInvoicePaymentPolling from '../hooks/useInvoicePaymentPolling.js';
import { formatDateInputValue, formatDisplayDate, formatDisplayMonth } from '../utils/dateFormat.js';
import { formatInvoiceAmount, formatInvoiceText } from '../utils/invoiceDisplay.js';
import { formatEnumLabel } from '../utils/i18nFormat.js';
import { exportRowsToExcel } from '../utils/excelExport.js';
import { isOccupiedRoom } from '../utils/roomEligibility.js';
import { formatRoomCode, formatRoomLabel } from '../utils/roomDisplay.js';
import ActionDialog from './common/ActionDialog.jsx';
import FilterBar from './common/FilterBar.jsx';
import InvoiceDetail from './InvoiceDetail.jsx';
import InvoiceTable, { formatInvoiceCode } from './InvoiceTable.jsx';
import LineIcon from './common/LineIcon.jsx';

const INVOICE_STATUS_FILTERS = [
  'ALL',
  'UNPAID',
  'PAID',
  'OVERDUE',
  'PENDING_CONFIRMATION',
  'REJECTED'
];

/** Chuẩn hóa chuỗi để so sánh và tìm kiếm hóa đơn. */
function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

/** Tạo hạn thanh toán mặc định dựa trên ngày lập hóa đơn. */
function getDefaultDueDate(invoiceDateValue) {
  if (!invoiceDateValue) {
    return '';
  }

  const [year, month, day] = invoiceDateValue.split('-').map(Number);
  const dueDateMonth = day > 5 ? month : month - 1;
  const dueDate = new Date(year, dueDateMonth, 5);
  return formatDateInputValue(dueDate);
}

/** Chỉ cho phép xóa hóa đơn khi trạng thái của nó còn phù hợp. */
function canDeleteInvoice(invoice) {
  return ['UNPAID', 'PENDING_CONFIRMATION', 'OVERDUE', 'REJECTED'].includes(invoice?.status);
}

/** Kiểm tra hóa đơn có khớp từ khóa theo mã, phòng, trạng thái hoặc thông tin liên quan. */
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

/** Lấy thời điểm đại diện của hóa đơn để sắp xếp mới nhất trước. */
function getInvoiceTime(invoice) {
  const dateValue = invoice.createdAt || invoice.invoiceDate || invoice.dueDate || invoice.month;
  const time = Date.parse(dateValue);
  return Number.isFinite(time) ? time : 0;
}

/** Kiểm tra hóa đơn có thuộc tháng đang được lọc hay không. */
function invoiceBelongsToMonth(invoice, month) {
  return invoice.month === month || String(invoice.invoiceDate || '').startsWith(month);
}

/** Tạo tên tệp Excel hóa đơn kèm mã tòa nhà và ngày xuất. */
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

/** Ưu tiên thông báo lỗi từ API, nếu không có thì dùng bản dịch dự phòng của giao diện. */
function getInvoiceErrorMessage(apiError, t, fallbackKey) {
  const message = apiError.response?.data?.message || '';
  const normalized = normalize(message);

  if (normalized.includes('utility reading')) {
    return t('buildingInvoices.errors.missingUtilityReading');
  }

  if (normalized.includes('invoice already exists')) {
    return t('buildingInvoices.blockReasons.ALREADY_INVOICED');
  }

  if (normalized.includes('active head resident')) {
    return t('buildingInvoices.blockReasons.NO_ACTIVE_HEAD_RESIDENT');
  }

  if (normalized.includes('occupied rooms')) {
    return t('buildingInvoices.blockReasons.ROOM_NOT_OCCUPIED');
  }

  return message || t(fallbackKey);
}

/** Tạo dữ liệu ban đầu cho form lập hóa đơn. */
function createInitialForm() {
  const invoiceDate = formatDateInputValue();

  return {
    roomId: '',
    invoiceDate,
    dueDate: getDefaultDueDate(invoiceDate),
    additionalChargeAmount: '',
    additionalChargeNote: ''
  };
}

/** Chuẩn hóa khoản thu thêm về số không âm trước khi xem trước hóa đơn. */
function normalizeAdditionalCharge(value) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : 0;
}

/** Cộng khoản thu thêm vào dữ liệu xem trước mà không thay đổi dữ liệu gốc từ API. */
function applyAdditionalChargeToPreview(preview, additionalChargeAmount, additionalChargeNote = '') {
  const amount = normalizeAdditionalCharge(additionalChargeAmount);

  if (!preview || amount <= 0) {
    return preview;
  }

  const items = Array.isArray(preview.items) ? preview.items : [];
  const hasAdditionalCharge = items.some((item) => item.itemName === 'Additional charge');

  if (hasAdditionalCharge) {
    return preview;
  }

  return {
    ...preview,
    totalAmount: Number(preview.totalAmount || 0) + amount,
    items: [
      ...items,
      {
        itemName: 'Additional charge',
        note: additionalChargeNote.trim() || 'Extra room charge',
        quantity: 1,
        unitPrice: amount,
        amount
      }
    ]
  };
}

/** Tạo khóa nhận diện cho lần xem trước hóa đơn của một phòng. */
function buildSinglePreviewKey(form) {
  return [
    form.roomId || '',
    form.invoiceDate || '',
    form.dueDate || '',
    normalizeAdditionalCharge(form.additionalChargeAmount),
    form.additionalChargeNote || ''
  ].join('|');
}

/** Khung hiển thị xem trước chi tiết của một hóa đơn trước khi phát hành. */
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
    <section className="invoice-preview-panel invoice-preview-panel-single">
      <div className="invoice-preview-header">
        <div>
          <span>{t('buildingInvoices.previewEyebrow')}</span>
        </div>
        <strong>{formatInvoiceAmount(preview.totalAmount)}</strong>
      </div>

      <div className="invoice-preview-summary-grid">
        <div>
          <span>{t('tables.common.room')}</span>
          <strong>{formatRoomCode(preview)}</strong>
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
          <span>{t('tables.common.dueDate')}</span>
          <strong>{formatDisplayDate(preview.dueDate)}</strong>
        </div>
        <div>
          <span>{t('tables.common.month')}</span>
          <strong>{formatDisplayMonth(preview.invoiceMonth)}</strong>
        </div>
        <div>
          <span>{t('buildingInvoices.utilityMonth')}</span>
          <strong>{preview.utilityReadingRequired ? formatDisplayMonth(preview.utilityMonth) : t('common.notApplicable')}</strong>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="invoice-preview-notes">
          {warnings.map((warning) => (
            <span key={warning}>{warning}</span>
          ))}
        </div>
      )}

      <div className="invoice-preview-item-table-wrap" aria-label={t('buildingInvoices.itemList')}>
        <table className="data-table invoice-preview-item-table">
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
                <td>
                  <strong>{formatInvoiceText(t, item.itemName)}</strong>
                </td>
                <td>{formatInvoiceAmount(item.quantity)}</td>
                <td>{formatInvoiceAmount(item.unitPrice)}</td>
                <td>
                  <strong className="invoice-preview-item-amount">{formatInvoiceAmount(item.amount)}</strong>
                </td>
                <td>{item.note ? formatInvoiceText(t, item.note) : t('common.notProvided')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** Khung tổng hợp kết quả xem trước khi tạo nhiều hóa đơn cùng lúc. */
function BulkPreviewPanel({ preview }) {
  const { t } = useTranslation();
  const eligibleInvoices = preview?.eligibleInvoices || [];
  const blockedRooms = preview?.blockedRooms || [];

  if (!preview) {
    return <div className="empty-state">{t('buildingInvoices.bulkPreviewEmpty')}</div>;
  }

  return (
    <section className="invoice-preview-panel">
      <div className="invoice-preview-header">
        <div>
          <span>{t('buildingInvoices.bulkPreviewEyebrow')}</span>
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

      <div className="invoice-bulk-sections">
        <section className="invoice-bulk-table-section">
          <div className="invoice-bulk-table-heading">
            <span>{t('buildingInvoices.eligibleRoomsTable')}</span>
            <strong>{t('buildingInvoices.eligibleRooms')}</strong>
          </div>
          <div className="table-wrap invoice-bulk-table-wrap">
            <table className="data-table invoice-bulk-table">
              <thead>
                <tr>
                  <th>{t('tables.common.room')}</th>
                  <th>{t('tables.common.headResident')}</th>
                  <th>{t('tables.common.totalAmount')}</th>
                </tr>
              </thead>
              <tbody>
                {eligibleInvoices.map((invoice) => (
                  <tr key={invoice.roomId}>
                    <td>{formatRoomCode(invoice)}</td>
                    <td>{invoice.residentHeadName || t('common.notProvided')}</td>
                    <td>{formatInvoiceAmount(invoice.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {eligibleInvoices.length === 0 && (
              <div className="empty-state flat-empty-state">{t('buildingInvoices.noEligibleRooms')}</div>
            )}
          </div>
        </section>

        <section className="invoice-bulk-table-section">
          <div className="invoice-bulk-table-heading">
            <span>{t('buildingInvoices.blockedRoomsTable')}</span>
            <strong>{t('buildingInvoices.blockedRooms')}</strong>
          </div>
          <div className="table-wrap invoice-bulk-table-wrap">
            <table className="data-table invoice-bulk-table">
              <thead>
                <tr>
                  <th>{t('tables.common.room')}</th>
                  <th>{t('tables.common.headResident')}</th>
                  <th>{t('buildingInvoices.reason')}</th>
                </tr>
              </thead>
              <tbody>
                {blockedRooms.map((room) => (
                  <tr key={`${room.roomId}-${room.reasonCode}`}>
                    <td>{formatRoomCode(room)}</td>
                    <td>{room.residentHeadName || t('common.notProvided')}</td>
                    <td>
                      {t(`buildingInvoices.blockReasons.${room.reasonCode}`, {
                        defaultValue: room.reason
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {blockedRooms.length === 0 && (
              <div className="empty-state flat-empty-state">{t('buildingInvoices.noBlockedRooms')}</div>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}

/** Không gian lập và quản lý hóa đơn của tòa nhà: lọc, xem trước, phát hành, xuất và xóa. */
export default function BuildingInvoiceWorkspace() {
  const { t } = useTranslation();
  const { building } = useOutletContext();
  const [rooms, setRooms] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [singlePreview, setSinglePreview] = useState(null);
  const [singlePreviewKey, setSinglePreviewKey] = useState('');
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
  const [processing, setProcessing] = useState(false);
  const [loadingDetailId, setLoadingDetailId] = useState(null);

  const invoiceMonth = form.invoiceDate ? form.invoiceDate.slice(0, 7) : '';
  const currentSinglePreviewKey = useMemo(() => buildSinglePreviewKey(form), [
    form.roomId,
    form.invoiceDate,
    form.dueDate,
    form.additionalChargeAmount,
    form.additionalChargeNote
  ]);
  const visibleSinglePreview = singlePreviewKey === currentSinglePreviewKey ? singlePreview : null;
  const invoicedRoomIdsForMonth = useMemo(() => {
    return new Set(
      invoices
        // API returns a full ISO date (for example 2026-08-01), while the form uses YYYY-MM.
        // Reuse the common month comparison so rooms already invoiced for this month are hidden.
        .filter((invoice) => invoiceBelongsToMonth(invoice, invoiceMonth))
        .map((invoice) => invoice.roomId)
    );
  }, [invoices, invoiceMonth]);
  const availableRooms = useMemo(() => {
    return rooms.filter((room) => {
      return isOccupiedRoom(room) && !invoicedRoomIdsForMonth.has(room.id);
    });
  }, [rooms, invoicedRoomIdsForMonth]);
  const invoiceSummary = useMemo(() => {
    const totalInvoices = rooms.filter(isOccupiedRoom).length;
    const createdInvoices = invoices.filter((invoice) => invoiceBelongsToMonth(invoice, invoiceMonth)).length;

    return {
      totalInvoices,
      createdInvoices,
      missingInvoices: Math.max(totalInvoices - createdInvoices, 0)
    };
  }, [invoices, invoiceMonth, rooms]);
  const invoiceSummaryCards = [
    {
      key: 'total',
      icon: 'fileText',
      label: t('buildingInvoices.summary.total'),
      meta: t('buildingInvoices.summary.totalMeta'),
      tone: 'total',
      value: invoiceSummary.totalInvoices
    },
    {
      key: 'created',
      icon: 'checkShield',
      label: t('buildingInvoices.summary.created'),
      meta: t('buildingInvoices.summary.createdMeta'),
      tone: 'created',
      value: invoiceSummary.createdInvoices
    },
    {
      key: 'missing',
      icon: 'clock',
      label: t('buildingInvoices.summary.missing'),
      meta: t('buildingInvoices.summary.missingMeta'),
      tone: 'missing',
      value: invoiceSummary.missingInvoices
    }
  ];
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
      setSinglePreviewKey('');
    }
  }, [availableRooms, form.roomId]);

  const loadData = async () => {
    setError('');

    try {
      const [roomsResponse, invoicesResponse] = await Promise.all([
        roomApi.getAdminRooms({ buildingId: building.id }),
        invoiceApi.getAdminBuildingInvoices(building.id)
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
    setSinglePreviewKey('');
    setBulkPreview(null);
    loadData().finally(() => setLoading(false));
  }, [building.id, t]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setSinglePreview(null);
    setSinglePreviewKey('');
    setBulkPreview(null);
    setError('');

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
    setSinglePreviewKey('');
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
    setSinglePreviewKey('');
    setBulkPreview(null);
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
    dueDate: form.dueDate,
    additionalChargeAmount: normalizeAdditionalCharge(form.additionalChargeAmount),
    additionalChargeNote: form.additionalChargeNote.trim()
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
      const response = await invoiceApi.previewBuildingInvoice(building.id, getSinglePayload());
      setSinglePreview(applyAdditionalChargeToPreview(response.data, form.additionalChargeAmount, form.additionalChargeNote));
      setSinglePreviewKey(buildSinglePreviewKey(form));
    } catch (apiError) {
      setError(getInvoiceErrorMessage(apiError, t, 'buildingInvoices.previewError'));
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerateSingle = async () => {
    setProcessing(true);
    setMessage('');
    setError('');

    try {
      const response = await invoiceApi.generateBuildingInvoice(building.id, getSinglePayload());
      setSelectedInvoice(applyAdditionalChargeToPreview(response.data, form.additionalChargeAmount, form.additionalChargeNote));
      setSinglePreview(null);
      setSinglePreviewKey('');
      setComposerOpen(false);
      setForm(createInitialForm());
      setMessage(t('buildingInvoices.generated'));
      await loadData();
    } catch (apiError) {
      setError(getInvoiceErrorMessage(apiError, t, 'buildingInvoices.generateError'));
    } finally {
      setProcessing(false);
    }
  };

  const handlePreviewBulk = async () => {
    setProcessing(true);
    setMessage('');
    setError('');

    try {
      const response = await invoiceApi.previewBuildingBulkInvoices(building.id, getBulkPayload());
      setBulkPreview(response.data);
    } catch (apiError) {
      setError(getInvoiceErrorMessage(apiError, t, 'buildingInvoices.bulkPreviewError'));
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerateBulk = async () => {
    setProcessing(true);
    setMessage('');
    setError('');

    try {
      const response = await invoiceApi.generateBuildingBulkInvoices(building.id, getBulkPayload());
      setBulkPreview(null);
      setComposerOpen(false);
      setMessage(t('buildingInvoices.bulkGenerated', { count: response.data.length }));
      await loadData();
    } catch (apiError) {
      setError(getInvoiceErrorMessage(apiError, t, 'buildingInvoices.bulkGenerateError'));
    } finally {
      setProcessing(false);
    }
  };

  const loadInvoiceDetail = async (invoiceId) => {
    return invoiceApi.getAdminBuildingInvoice(building.id, invoiceId);
  };

  const handleView = async (invoice) => {
    setLoadingDetailId(invoice.id);
    setError('');

    try {
      const response = await loadInvoiceDetail(invoice.id);
      setSelectedInvoice(response.data);
    } catch (apiError) {
      setError(getInvoiceErrorMessage(apiError, t, 'buildingInvoices.invoiceLoadError'));
    } finally {
      setLoadingDetailId(null);
    }
  };

  const handleDelete = async (invoice) => {
    if (!window.confirm(t('buildingInvoices.deleteConfirm', { room: formatRoomCode(invoice), month: formatDisplayMonth(invoice.month) }))) {
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
      setError(getInvoiceErrorMessage(apiError, t, 'buildingInvoices.deleteError'));
    } finally {
      setProcessing(false);
    }
  };

  const fetchSelectedInvoice = useCallback(() => {
    return loadInvoiceDetail(selectedInvoice.id);
  }, [building.id, selectedInvoice?.id]);

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
      {canDeleteInvoice(invoice) && (
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
      <div className="building-section-header">
        <span className="page-eyebrow">{t('buildingInvoices.eyebrow')}</span>
        <div className="button-row">
          <button className="button-link inline-button" type="button" onClick={() => handleOpenComposer('single')}>
            <PlusIcon />
            {t('buildingInvoices.actions.createSingle')}
          </button>
          <button className="secondary-button inline-button" type="button" onClick={handleExport}>
            <DownloadIcon />
            {t('buildingInvoices.actions.exportExcel')}
          </button>
        </div>
      </div>

      {message && <div className="alert success-alert">{message}</div>}
      {error && !composerOpen && <div className="alert error-alert">{error}</div>}

      <ActionDialog
        className={`action-dialog-wide invoice-action-dialog invoice-action-dialog-${mode}`}
        eyebrow={mode === 'single' ? t('buildingInvoices.singleRoom') : t('buildingInvoices.bulk')}
        labelledBy="invoice-composer-dialog-title"
        open={composerOpen}
        title={mode === 'single' ? t('buildingInvoices.actions.createSingle') : t('buildingInvoices.actions.createBulk')}
        onClose={handleCloseComposer}
      >
        <section className="invoice-composer-panel">
          {error && <div className="alert error-alert invoice-dialog-alert">{error}</div>}

          <div className="invoice-composer-grid">
            <div className="invoice-command-panel">
              <div className="segmented-control">
                <button
                  className={mode === 'single' ? 'active' : ''}
                  type="button"
                  onClick={() => {
                    setMode('single');
                    setError('');
                  }}
                >
                  {t('buildingInvoices.singleRoom')}
                </button>
                <button
                  className={mode === 'bulk' ? 'active' : ''}
                  type="button"
                  onClick={() => {
                    setMode('bulk');
                    setError('');
                  }}
                >
                  {t('buildingInvoices.bulk')}
                </button>
              </div>

              <form className="panel-form invoice-create-form" onSubmit={handlePreviewSingle}>
                <div className="form-grid invoice-create-form-grid">
                  <div>
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
                  </div>

                  <div>
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
                  </div>

                  {mode === 'single' && (
                    <>
                      <div className="form-grid-wide">
                        <label htmlFor="roomId">{t('tables.common.room')}</label>
                        <select id="roomId" name="roomId" value={form.roomId} onChange={handleFormChange} required>
                          <option value="">{t('forms.utilityReading.selectRoom')}</option>
                          {availableRooms.map((room) => (
                            <option key={room.id} value={room.id}>
                              {formatRoomCode(room)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-grid-wide">
                        <label htmlFor="additionalChargeAmount">{t('buildingInvoices.additionalCharge')}</label>
                        <div className="currency-input-shell">
                          <input
                            id="additionalChargeAmount"
                            name="additionalChargeAmount"
                            type="number"
                            min="0"
                            step="1000"
                            inputMode="numeric"
                            placeholder="0"
                            value={form.additionalChargeAmount}
                            onChange={handleFormChange}
                          />
                          <span>{t('buildingInvoices.currencyUnit')}</span>
                        </div>
                        <input
                          className="additional-charge-note-input"
                          id="additionalChargeNote"
                          name="additionalChargeNote"
                          type="text"
                          maxLength="255"
                          aria-label={t('buildingInvoices.additionalChargeNote')}
                          placeholder={t('buildingInvoices.additionalChargeNotePlaceholder')}
                          value={form.additionalChargeNote}
                          onChange={handleFormChange}
                        />
                      </div>
                      <button className="form-grid-wide" type="submit" disabled={processing || !form.roomId}>
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
                  disabled={processing || !visibleSinglePreview}
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
              {mode === 'single' ? <PreviewPanel preview={visibleSinglePreview} /> : <BulkPreviewPanel preview={bulkPreview} />}
            </div>
          </div>
        </section>
      </ActionDialog>

      {loading ? (
        <div className="empty-state">{t('buildingInvoices.loading')}</div>
      ) : (
        <section className="invoice-record-section">
          <div className="invoice-summary-grid">
            {invoiceSummaryCards.map((card) => (
              <div className={`invoice-summary-card invoice-summary-card-${card.tone}`} key={card.key}>
                <span className="invoice-summary-icon">
                  <LineIcon name={card.icon} />
                </span>
                <div className="invoice-summary-copy">
                  <span>{card.label}</span>
                  <small>{card.meta}</small>
                </div>
                <strong>{card.value}</strong>
              </div>
            ))}
          </div>

          <div className="invoice-filter-panel">
            <FilterBar
              as="div"
              className="invoice-search-tools"
              searchAriaLabel={t('buildingInvoices.filters.searchAria')}
              searchPlaceholder={t('buildingInvoices.filters.searchPlaceholder')}
              searchValue={search}
              suggestionFields={[
                'invoiceNumber',
                'roomCode',
                'roomName',
                'residentName',
                'residentEmail'
              ]}
              suggestionItems={invoices}
              actions={(
                <>
                  <div className="invoice-status-filter">
                    <select
                      id="invoiceStatusFilter"
                      aria-label={t('buildingInvoices.filters.statusLabel')}
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
                  <button
                    className="secondary-button inline-button invoice-sort-button"
                    type="button"
                    onClick={() => setSortDirection((current) => (current === 'desc' ? 'asc' : 'desc'))}
                  >
                    {sortDirection === 'desc' ? <ArrowDownIcon /> : <ArrowUpIcon />}
                    {sortDirection === 'desc' ? t('buildingInvoices.filters.newest') : t('buildingInvoices.filters.oldest')}
                  </button>
                </>
              )}
              clearLabel={t('common.clear')}
              onClear={handleClearInvoiceFilters}
              onSearchChange={setSearch}
            />
          </div>

          <InvoiceTable invoices={filteredInvoices} renderActions={renderActions} />
        </section>
      )}

      <ActionDialog
        className="action-dialog-wide invoice-action-dialog"
        eyebrow={selectedInvoice ? formatInvoiceCode(selectedInvoice) : t('buildingInvoices.eyebrow')}
        labelledBy="invoice-detail-dialog-title"
        open={Boolean(selectedInvoice)}
        title={t('tables.common.invoice')}
        onClose={() => setSelectedInvoice(null)}
      >
        {selectedInvoice && <InvoiceDetail invoice={selectedInvoice} />}
      </ActionDialog>
    </div>
  );
}

/** Biểu tượng thêm khoản thu hoặc tạo hóa đơn. */
function PlusIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

/** Biểu tượng xuất danh sách hóa đơn ra tệp. */
function DownloadIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

/** Biểu tượng mở rộng phần nội dung. */
function ArrowDownIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 5v14" />
      <path d="m7 14 5 5 5-5" />
    </svg>
  );
}

/** Biểu tượng thu gọn phần nội dung. */
function ArrowUpIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 19V5" />
      <path d="m7 10 5-5 5 5" />
    </svg>
  );
}

/** Biểu tượng xem chi tiết hóa đơn. */
function EyeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" />
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    </svg>
  );
}

/** Biểu tượng xóa hóa đơn. */
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
