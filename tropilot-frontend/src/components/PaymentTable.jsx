import { useTranslation } from 'react-i18next';
import { getPaymentStatusClass } from '../utils/paymentStatusOptions.js';
import { resolveFileUrl } from '../utils/fileUrl.js';
import { formatDisplayDateTime, formatDisplayMonth } from '../utils/dateFormat.js';
import { formatEnumLabel } from '../utils/i18nFormat.js';
import { formatRoomCode } from '../utils/roomDisplay.js';

function formatNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;
}

export default function PaymentTable({ payments, renderActions }) {
  const { t } = useTranslation();
  const hasActions = Boolean(renderActions);

  return (
    <div className="table-wrap">
      <table className="data-table payment-table">
        <thead>
          <tr>
            <th>{t('tables.common.invoice')}</th>
            <th>{t('tables.common.room')}</th>
            <th>{t('tables.common.headResident')}</th>
            <th>{t('tables.common.amount')}</th>
            <th>{t('tables.common.status')}</th>
            <th>{t('tables.common.proof')}</th>
            <th>{t('tables.payments.uploadedAt')}</th>
            <th>{t('tables.common.note')}</th>
            {hasActions && <th>{t('tables.common.actions')}</th>}
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td>
                <strong>#{payment.invoiceId}</strong>
                <span className="table-subtext">{formatDisplayMonth(payment.invoiceMonth)}</span>
              </td>
              <td>
                <strong>{formatRoomCode(payment)}</strong>
                <span className="table-subtext">{payment.buildingCode}</span>
              </td>
              <td>
                <strong>{payment.residentHeadName}</strong>
                <span className="table-subtext">{payment.residentHeadEmail}</span>
              </td>
              <td>{formatNumber(payment.invoiceTotalAmount)}</td>
              <td>
                <span className={getPaymentStatusClass(payment.status)}>
                  {formatEnumLabel(t, 'paymentStatus', payment.status)}
                </span>
              </td>
              <td>
                <a className="secondary-link compact-link" href={resolveFileUrl(payment.proofImageUrl)} target="_blank" rel="noreferrer">
                  {t('common.view')}
                </a>
              </td>
              <td>{formatDisplayDateTime(payment.uploadedAt)}</td>
              <td>{payment.note || t('common.notProvided')}</td>
              {hasActions && <td>{renderActions(payment)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
      {payments.length === 0 && <div className="empty-state flat-empty-state">{t('tables.payments.empty')}</div>}
    </div>
  );
}
