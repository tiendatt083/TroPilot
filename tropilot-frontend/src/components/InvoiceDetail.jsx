import { useTranslation } from 'react-i18next';
import { getInvoiceStatusClass } from '../utils/invoiceStatusOptions.js';
import { resolveFileUrl } from '../utils/fileUrl.js';
import { formatDisplayDate, formatDisplayMonth } from '../utils/dateFormat.js';
import { formatEnumLabel } from '../utils/i18nFormat.js';
import { formatRoomLabel } from '../utils/roomDisplay.js';

function formatNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;
}

export default function InvoiceDetail({ invoice }) {
  const { t } = useTranslation();

  if (!invoice) {
    return <div className="empty-state">{t('tables.invoiceItems.selectInvoice')}</div>;
  }

  return (
    <section className="invoice-detail-panel">
      <div className="detail-panel">
        <div>
          <span>{t('tables.common.room')}</span>
          <strong>{formatRoomLabel(invoice)}</strong>
        </div>
        <div>
          <span>{t('tables.common.building')}</span>
          <strong>
            {invoice.buildingCode} - {invoice.buildingName}
          </strong>
        </div>
        <div>
          <span>{t('tables.common.headResident')}</span>
          <strong>{invoice.residentHeadName}</strong>
        </div>
        <div>
          <span>{t('tables.common.month')}</span>
          <strong>{formatDisplayMonth(invoice.month)}</strong>
        </div>
        <div>
          <span>{t('tables.common.dueDate')}</span>
          <strong>{formatDisplayDate(invoice.dueDate)}</strong>
        </div>
        <div>
          <span>{t('tables.common.status')}</span>
          <strong>
            <span className={getInvoiceStatusClass(invoice.status)}>
              {formatEnumLabel(t, 'invoiceStatus', invoice.status)}
            </span>
          </strong>
        </div>
        <div>
          <span>{t('tables.common.totalAmount')}</span>
          <strong>{formatNumber(invoice.totalAmount)}</strong>
        </div>
        <div>
          <span>{t('tables.common.createdBy')}</span>
          <strong>{invoice.createdByName}</strong>
        </div>
      </div>

      <div className="invoice-evidence-row">
        {invoice.electricityImageUrl && (
          <a className="secondary-link compact-link" href={resolveFileUrl(invoice.electricityImageUrl)} target="_blank" rel="noreferrer">
            {t('tables.invoiceItems.electricityEvidence')}
          </a>
        )}
        {invoice.waterImageUrl && (
          <a className="secondary-link compact-link" href={resolveFileUrl(invoice.waterImageUrl)} target="_blank" rel="noreferrer">
            {t('tables.invoiceItems.waterEvidence')}
          </a>
        )}
      </div>

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
            {(invoice.items || []).map((item) => (
              <tr key={item.id || item.itemName}>
                <td>{item.itemName}</td>
                <td>{formatNumber(item.quantity)}</td>
                <td>{formatNumber(item.unitPrice)}</td>
                <td>{formatNumber(item.amount)}</td>
                <td>{item.note || t('common.notProvided')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(invoice.items || []).length === 0 && <div className="empty-state flat-empty-state">{t('tables.invoiceItems.empty')}</div>}
      </div>
    </section>
  );
}
