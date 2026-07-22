import { useTranslation } from 'react-i18next';
import { getInvoiceStatusClass } from '../utils/invoiceStatusOptions.js';
import { openFileUrl, resolveFileUrl } from '../utils/fileUrl.js';
import { formatDisplayDate, formatDisplayMonth } from '../utils/dateFormat.js';
import { formatEnumLabel } from '../utils/i18nFormat.js';
import { formatInvoiceAmount, formatInvoiceText } from '../utils/invoiceDisplay.js';
import { formatRoomLabel } from '../utils/roomDisplay.js';
import LineIcon from './common/LineIcon.jsx';

function formatBankName(payment) {
  const rawCode = String(payment?.bankCode || payment?.bankName || '').trim();
  const normalized = rawCode.toUpperCase();

  if (['TPB', 'TPBANK', 'TIENPHONGBANK', 'TIEN PHONG BANK'].includes(normalized.replace(/\s+/g, ''))) {
    return 'TPBank - Tien Phong Bank';
  }

  return payment?.bankName || rawCode || '';
}

function resolveItemCalculationType(item) {
  if (item?.calculationType) {
    return item.calculationType;
  }

  const itemName = String(item?.itemName || '').toLowerCase();

  if (itemName.includes('usage')) {
    return 'BY_USAGE';
  }

  if (itemName.includes('occupant') || itemName.includes('person')) {
    return 'BY_PERSON';
  }

  return 'FIXED';
}

function normalizeItemText(item) {
  return `${item?.itemName || ''} ${item?.note || ''}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function isElectricityItem(item) {
  const text = normalizeItemText(item);
  return text.includes('electricity')
    || text.includes('electric usage')
    || text.includes('tien dien')
    || text.includes('dien tieu thu')
    || text.includes('dien tinh theo')
    || text.includes('dien co dinh');
}

function isWaterItem(item) {
  const text = normalizeItemText(item);
  return text.includes('water')
    || text.includes('tien nuoc')
    || text.includes('nuoc tieu thu')
    || text.includes('nuoc tinh theo')
    || text.includes('nuoc co dinh');
}

function buildDisplayItems(invoice) {
  const items = Array.isArray(invoice?.items) ? [...invoice.items] : [];

  if (!items.some(isElectricityItem)) {
    items.push({
      id: 'synthetic-electricity-charge',
      itemName: 'Electricity',
      calculationType: 'BY_USAGE',
      quantity: 0,
      unitPrice: 0,
      amount: 0,
      note: 'No electricity charge this month'
    });
  }

  if (!items.some(isWaterItem)) {
    items.push({
      id: 'synthetic-water-charge',
      itemName: 'Water',
      calculationType: 'BY_USAGE',
      quantity: 0,
      unitPrice: 0,
      amount: 0,
      note: 'No water charge this month'
    });
  }

  return items;
}

function InvoiceSummaryItem({ icon, label, value, showIcon }) {
  return (
    <div className={showIcon ? 'invoice-summary-item invoice-summary-item-with-icon' : ''}>
      {showIcon && (
        <span className="invoice-summary-item-icon">
          <LineIcon name={icon} />
        </span>
      )}
      <span className="invoice-summary-item-copy">
        <span>{label}</span>
        <strong>{value}</strong>
      </span>
    </div>
  );
}

export default function InvoiceDetail({
  invoice,
  paymentUploadSlot = null,
  showPaymentInstructions = false,
  showSummaryIcons = false
}) {
  const { t } = useTranslation();

  if (!invoice) {
    return <div className="empty-state">{t('tables.invoiceItems.selectInvoice')}</div>;
  }

  const paymentCompleted =
    invoice.status === 'PAID' || invoice.sepayPayment?.status === 'PAID';
  const shouldShowPaymentInstructions =
    showPaymentInstructions && invoice.sepayPayment && !paymentCompleted;
  const displayItems = buildDisplayItems(invoice);
  const hasEvidenceLinks = Boolean(invoice.electricityImageUrl || invoice.waterImageUrl);
  const detailPanel = (
    <div className="detail-panel invoice-detail-summary-grid">
      <InvoiceSummaryItem
        icon="building"
        label={t('tables.common.room')}
        showIcon={showSummaryIcons}
        value={formatRoomLabel(invoice)}
      />
      <InvoiceSummaryItem
        icon="building"
        label={t('tables.common.building')}
        showIcon={showSummaryIcons}
        value={`${invoice.buildingCode} - ${invoice.buildingName}`}
      />
      <InvoiceSummaryItem
        icon="user"
        label={t('tables.common.headResident')}
        showIcon={showSummaryIcons}
        value={invoice.residentHeadName}
      />
      <InvoiceSummaryItem
        icon="calendar"
        label={t('buildingInvoices.invoiceDate')}
        showIcon={showSummaryIcons}
        value={formatDisplayDate(invoice.invoiceDate)}
      />
      <InvoiceSummaryItem
        icon="calendar"
        label={t('tables.common.month')}
        showIcon={showSummaryIcons}
        value={formatDisplayMonth(invoice.month)}
      />
      <InvoiceSummaryItem
        icon="droplet"
        label={t('buildingInvoices.utilityMonth')}
        showIcon={showSummaryIcons}
        value={invoice.utilityMonth ? formatDisplayMonth(invoice.utilityMonth) : t('common.notApplicable')}
      />
      <InvoiceSummaryItem
        icon="calendar"
        label={t('tables.common.dueDate')}
        showIcon={showSummaryIcons}
        value={formatDisplayDate(invoice.dueDate)}
      />
      <InvoiceSummaryItem
        icon="checkShield"
        label={t('tables.common.status')}
        showIcon={showSummaryIcons}
        value={(
          <span className={getInvoiceStatusClass(invoice.status)}>
            {formatEnumLabel(t, 'invoiceStatus', invoice.status)}
          </span>
        )}
      />
      <InvoiceSummaryItem
        icon="wallet"
        label={t('tables.common.totalAmount')}
        showIcon={showSummaryIcons}
        value={formatInvoiceAmount(invoice.totalAmount)}
      />
    </div>
  );

  const evidenceLinks = (
    <div className="invoice-evidence-row">
      {invoice.electricityImageUrl && (
        <a className="secondary-link compact-link" href={resolveFileUrl(invoice.electricityImageUrl)} target="_blank" rel="noreferrer" onClick={(event) => openFileUrl(invoice.electricityImageUrl, event)}>
          {t('tables.invoiceItems.electricityEvidence')}
        </a>
      )}
      {invoice.waterImageUrl && (
        <a className="secondary-link compact-link" href={resolveFileUrl(invoice.waterImageUrl)} target="_blank" rel="noreferrer" onClick={(event) => openFileUrl(invoice.waterImageUrl, event)}>
          {t('tables.invoiceItems.waterEvidence')}
        </a>
      )}
    </div>
  );

  const paymentInstruction = shouldShowPaymentInstructions ? (
    <section className="sepay-payment-panel">
      <div className="sepay-payment-copy">
        <div className="detail-panel compact-detail-panel sepay-transfer-grid">
          <div>
            <span>{t('sepayPayment.amount')}</span>
            <strong>{formatInvoiceAmount(invoice.sepayPayment.amount)}</strong>
          </div>
          <div>
            <span>{t('sepayPayment.bank')}</span>
            <strong>{formatBankName(invoice.sepayPayment)}</strong>
          </div>
          <div>
            <span>{t('sepayPayment.accountNumber')}</span>
            <strong>{invoice.sepayPayment.accountNumber}</strong>
          </div>
          <div>
            <span>{t('sepayPayment.content')}</span>
            <strong>{invoice.sepayPayment.paymentCode}</strong>
          </div>
          <div>
            <span>{t('tables.common.status')}</span>
            <strong>{t(`sepayPayment.status.${invoice.sepayPayment.status}`)}</strong>
          </div>
        </div>
        {paymentUploadSlot}
      </div>

      <div className="sepay-qr-card">
        <img src={invoice.sepayPayment.qrImageUrl} alt={t('sepayPayment.qrAlt')} />
        <span>STK: {invoice.sepayPayment.accountNumber}</span>
        <span>{t('sepayPayment.content')}: {invoice.sepayPayment.paymentCode}</span>
      </div>
    </section>
  ) : null;

  const itemTable = (
    <div className="table-wrap invoice-item-table-wrap">
      <table className="data-table invoice-item-table">
        <thead>
          <tr>
            <th>{t('buildingInvoices.columns.id')}</th>
            <th>{t('tables.common.expense')}</th>
            <th>{t('tables.common.calculation')}</th>
            <th>{t('tables.common.quantity')}</th>
            <th>{t('tables.common.unitPrice')}</th>
            <th>{t('tables.common.amount')}</th>
            <th>{t('tables.common.note')}</th>
          </tr>
        </thead>
        <tbody>
          {displayItems.map((item, index) => (
            <tr key={item.id || `${item.itemName}-${item.amount}`}>
              <td>{index + 1}</td>
              <td>{formatInvoiceText(t, item.itemName)}</td>
              <td>{formatEnumLabel(t, 'calculationType', resolveItemCalculationType(item))}</td>
              <td>{formatInvoiceAmount(item.quantity)}</td>
              <td>{formatInvoiceAmount(item.unitPrice)}</td>
              <td>{formatInvoiceAmount(item.amount)}</td>
              <td>{item.note ? formatInvoiceText(t, item.note) : t('common.notProvided')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {displayItems.length === 0 && <div className="empty-state flat-empty-state">{t('tables.invoiceItems.empty')}</div>}
    </div>
  );

  if (showPaymentInstructions) {
    return (
      <section className="invoice-detail-panel resident-payment-detail-layout">
        <div className={`resident-invoice-top-grid ${paymentInstruction ? '' : 'resident-invoice-top-grid-single'}`}>
          {detailPanel}
          {paymentInstruction}
        </div>

        {hasEvidenceLinks && evidenceLinks}

        <div className="resident-invoice-items-panel">
          {itemTable}
        </div>
      </section>
    );
  }

  return (
    <section className="invoice-detail-panel">
      {detailPanel}
      {hasEvidenceLinks && evidenceLinks}

      {shouldShowPaymentInstructions && (
        paymentInstruction
      )}

      {itemTable}
    </section>
  );
}
