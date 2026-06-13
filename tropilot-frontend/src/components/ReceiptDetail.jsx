import EmptyState from './common/EmptyState.jsx';
import StatusBadge from './common/StatusBadge.jsx';
import { formatDisplayMonth } from '../utils/dateFormat.js';
import { getReceiptStatusClass, getReceiptStatusLabel } from '../utils/paymentStatusOptions.js';
import { formatRoomLabel } from '../utils/roomDisplay.js';

function formatNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;
}

export default function ReceiptDetail({ receipt, showBuilding = false }) {
  if (!receipt) {
    return <EmptyState message="Select a receipt to view details." />;
  }

  return (
    <section className="receipt-detail-panel">
      <div className="detail-panel">
        <div>
          <span>Receipt code</span>
          <strong>{receipt.receiptCode}</strong>
        </div>
        <div>
          <span>Status</span>
          <strong>
            <StatusBadge className={getReceiptStatusClass(receipt.status)}>
              {getReceiptStatusLabel(receipt.status)}
            </StatusBadge>
          </strong>
        </div>
        <div>
          <span>Invoice</span>
          <strong>
            #{receipt.invoiceId} - {formatDisplayMonth(receipt.invoiceMonth)}
          </strong>
        </div>
        <div>
          <span>Amount</span>
          <strong>{formatNumber(receipt.amount)}</strong>
        </div>
        <div>
          <span>Room</span>
          <strong>{formatRoomLabel(receipt)}</strong>
        </div>
        {showBuilding && (
          <div>
            <span>Building</span>
            <strong>
              {receipt.buildingCode} - {receipt.buildingName}
            </strong>
          </div>
        )}
        <div>
          <span>Head Resident</span>
          <strong>{receipt.residentHeadName}</strong>
        </div>
        <div>
          <span>Created by</span>
          <strong>{receipt.createdByName}</strong>
        </div>
        <div className="detail-wide">
          <span>Content</span>
          <p>{receipt.content}</p>
        </div>
      </div>
    </section>
  );
}
