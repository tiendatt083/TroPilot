import { useTranslation } from 'react-i18next';
import EmptyState from './common/EmptyState.jsx';
import StatusBadge from './common/StatusBadge.jsx';
import { formatDisplayMonth } from '../utils/dateFormat.js';
import { formatEnumLabel } from '../utils/i18nFormat.js';
import { getReceiptStatusClass } from '../utils/paymentStatusOptions.js';
import { formatRoomLabel } from '../utils/roomDisplay.js';

function formatNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;
}

export default function ReceiptDetail({ receipt, showBuilding = false }) {
  const { t } = useTranslation();

  if (!receipt) {
    return <EmptyState message={t('tables.receipts.selectReceipt')} />;
  }

  return (
    <section className="receipt-detail-panel">
      <div className="detail-panel">
        <div>
          <span>{t('tables.receipts.receiptCode')}</span>
          <strong>{receipt.receiptCode}</strong>
        </div>
        <div>
          <span>{t('tables.common.status')}</span>
          <strong>
            <StatusBadge className={getReceiptStatusClass(receipt.status)}>
              {formatEnumLabel(t, 'receiptStatus', receipt.status)}
            </StatusBadge>
          </strong>
        </div>
        <div>
          <span>{t('tables.common.invoice')}</span>
          <strong>
            #{receipt.invoiceId} - {formatDisplayMonth(receipt.invoiceMonth)}
          </strong>
        </div>
        <div>
          <span>{t('tables.common.amount')}</span>
          <strong>{formatNumber(receipt.amount)}</strong>
        </div>
        <div>
          <span>{t('tables.common.room')}</span>
          <strong>{formatRoomLabel(receipt)}</strong>
        </div>
        {showBuilding && (
          <div>
            <span>{t('tables.common.building')}</span>
            <strong>
              {receipt.buildingCode} - {receipt.buildingName}
            </strong>
          </div>
        )}
        <div>
          <span>{t('tables.common.headResident')}</span>
          <strong>{receipt.residentHeadName}</strong>
        </div>
        <div>
          <span>{t('tables.common.createdBy')}</span>
          <strong>{receipt.createdByName}</strong>
        </div>
        <div className="detail-wide">
          <span>{t('tables.common.content')}</span>
          <p>{receipt.content}</p>
        </div>
      </div>
    </section>
  );
}
