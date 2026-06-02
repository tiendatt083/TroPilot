import { useTranslation } from 'react-i18next';
import { getReceiptStatusClass } from '../utils/paymentStatusOptions.js';
import { formatDisplayDateTime, formatDisplayMonth } from '../utils/dateFormat.js';
import { formatEnumLabel } from '../utils/i18nFormat.js';
import { formatRoomCode } from '../utils/roomDisplay.js';

function formatNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;
}

export default function ReceiptTable({ receipts, renderActions }) {
  const { t } = useTranslation();
  const hasActions = Boolean(renderActions);

  return (
    <div className="table-wrap">
      <table className="data-table receipt-table">
        <thead>
          <tr>
            <th>{t('tables.receipts.title')}</th>
            <th>{t('tables.common.invoice')}</th>
            <th>{t('tables.common.room')}</th>
            <th>{t('tables.common.headResident')}</th>
            <th>{t('tables.common.amount')}</th>
            <th>{t('tables.common.status')}</th>
            <th>{t('tables.common.createdBy')}</th>
            {hasActions && <th>{t('tables.common.actions')}</th>}
          </tr>
        </thead>
        <tbody>
          {receipts.map((receipt) => (
            <tr key={receipt.id}>
              <td>
                <strong>{receipt.receiptCode}</strong>
                <span className="table-subtext">{formatDisplayDateTime(receipt.createdAt)}</span>
              </td>
              <td>
                <strong>#{receipt.invoiceId}</strong>
                <span className="table-subtext">{formatDisplayMonth(receipt.invoiceMonth)}</span>
              </td>
              <td>
                <strong>{formatRoomCode(receipt)}</strong>
                <span className="table-subtext">{receipt.buildingCode}</span>
              </td>
              <td>
                <strong>{receipt.residentHeadName}</strong>
                <span className="table-subtext">{receipt.residentHeadEmail}</span>
              </td>
              <td>{formatNumber(receipt.amount)}</td>
              <td>
                <span className={getReceiptStatusClass(receipt.status)}>
                  {formatEnumLabel(t, 'receiptStatus', receipt.status)}
                </span>
              </td>
              <td>
                <strong>{receipt.createdByName}</strong>
                <span className="table-subtext">{receipt.createdByRole}</span>
              </td>
              {hasActions && <td>{renderActions(receipt)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
      {receipts.length === 0 && <div className="empty-state flat-empty-state">{t('tables.receipts.empty')}</div>}
    </div>
  );
}
