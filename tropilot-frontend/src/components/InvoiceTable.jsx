import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getInvoiceStatusClass } from '../utils/invoiceStatusOptions.js';
import { formatDisplayDate, formatDisplayMonth } from '../utils/dateFormat.js';
import { formatEnumLabel } from '../utils/i18nFormat.js';
import { formatRoomCode } from '../utils/roomDisplay.js';

function formatNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;
}

export default function InvoiceTable({ invoices, renderActions, detailPathBase }) {
  const { t } = useTranslation();
  const hasActions = Boolean(renderActions || detailPathBase);

  return (
    <div className="table-wrap">
      <table className="data-table invoice-table">
        <thead>
          <tr>
            <th>{t('tables.common.room')}</th>
            <th>{t('tables.common.headResident')}</th>
            <th>{t('tables.common.month')}</th>
            <th>{t('tables.common.dueDate')}</th>
            <th>{t('tables.common.status')}</th>
            <th>{t('tables.common.totalAmount')}</th>
            {hasActions && <th>{t('tables.common.actions')}</th>}
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id}>
              <td>
                <strong>{formatRoomCode(invoice)}</strong>
                <span className="table-subtext">{invoice.buildingCode}</span>
              </td>
              <td>
                <strong>{invoice.residentHeadName}</strong>
                <span className="table-subtext">{invoice.residentHeadEmail}</span>
              </td>
              <td>{formatDisplayMonth(invoice.month)}</td>
              <td>{formatDisplayDate(invoice.dueDate)}</td>
              <td>
                <span className={getInvoiceStatusClass(invoice.status)}>
                  {formatEnumLabel(t, 'invoiceStatus', invoice.status)}
                </span>
              </td>
              <td>{formatNumber(invoice.totalAmount)}</td>
              {hasActions && (
                <td>
                  {detailPathBase ? (
                    <Link className="secondary-link compact-link" to={`${detailPathBase}/${invoice.id}`}>
                      {t('common.view')}
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
