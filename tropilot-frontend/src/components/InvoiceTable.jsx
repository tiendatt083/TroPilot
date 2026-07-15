import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getInvoiceStatusClass } from '../utils/invoiceStatusOptions.js';
import { formatDisplayDate, formatDisplayMonth } from '../utils/dateFormat.js';
import { formatEnumLabel } from '../utils/i18nFormat.js';
import { formatRoomCode, formatRoomLabel } from '../utils/roomDisplay.js';

function formatNumber(value, locale) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString(locale, { maximumFractionDigits: 2 })
    : value;
}

export default function InvoiceTable({ invoices, renderActions, detailPathBase, hideSubtext = false }) {
  const { t, i18n } = useTranslation();
  const hasActions = Boolean(renderActions || detailPathBase);
  const locale = String(i18n.resolvedLanguage || i18n.language || '').startsWith('en') ? 'en-US' : 'vi-VN';

  return (
    <div className="table-wrap invoice-table-wrap">
      <table className="data-table invoice-table">
        <thead>
          <tr>
            <th>{t('buildingInvoices.columns.id')}</th>
            <th>{t('buildingInvoices.columns.invoiceNumber')}</th>
            <th>{t('buildingInvoices.columns.apartment')}</th>
            <th>{t('tables.common.totalAmount')}</th>
            <th>{t('tables.common.dueDate')}</th>
            <th>{t('tables.common.status')}</th>
            {hasActions && <th>{t('tables.common.actions')}</th>}
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice, index) => (
            <tr key={invoice.id}>
              <td className="invoice-id-cell">{index + 1}</td>
              <td className="invoice-number-cell">
                <strong>{formatInvoiceCode(invoice)}</strong>
                {!hideSubtext && <span className="table-subtext">{formatDisplayMonth(invoice.month)}</span>}
              </td>
              <td>
                <strong>{formatRoomLabel(invoice) || formatRoomCode(invoice)}</strong>
                {!hideSubtext && (
                  <span className="table-subtext">
                    {[invoice.buildingCode, invoice.residentHeadName].filter(Boolean).join(' - ')}
                  </span>
                )}
              </td>
              <td className="invoice-amount-cell">
                {formatInvoiceCurrency(invoice.totalAmount, locale, t('buildingInvoices.currencyUnit'))}
              </td>
              <td className="invoice-date-cell">{formatDisplayDate(invoice.dueDate)}</td>
              <td>
                <span className={getInvoiceStatusClass(invoice.status)}>
                  {formatEnumLabel(t, 'invoiceStatus', invoice.status)}
                </span>
              </td>
              {hasActions && (
                <td className="invoice-action-cell">
                  {detailPathBase ? (
                    <Link
                      aria-label={t('common.view')}
                      className="icon-action-button"
                      data-tooltip={t('common.view')}
                      to={`${detailPathBase}/${invoice.id}`}
                    >
                      <EyeIcon />
                    </Link>
                  ) : (
                    renderActions(invoice)
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {invoices.length === 0 && <div className="empty-state flat-empty-state">{t('tables.invoices.empty')}</div>}
    </div>
  );
}

export function formatInvoiceCode(invoice) {
  if (invoice.invoiceCode || invoice.code || invoice.invoiceNumber) {
    return invoice.invoiceCode || invoice.code || invoice.invoiceNumber;
  }

  const id = String(invoice.id || '').padStart(3, '0');
  return `HD-${formatDisplayMonth(invoice.month || invoice.invoiceDate, '00/0000')}-${id}`;
}

function formatInvoiceCurrency(value, locale, currencyLabel) {
  const formatted = formatNumber(value, locale);
  return formatted === value ? value : `${formatted} ${currencyLabel}`;
}

function EyeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" />
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    </svg>
  );
}
