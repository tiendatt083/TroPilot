import { getReceiptStatusClass, getReceiptStatusLabel } from '../utils/paymentStatusOptions.js';

function formatNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;
}

export default function ReceiptTable({ receipts, renderActions }) {
  const hasActions = Boolean(renderActions);

  return (
    <div className="table-wrap">
      <table className="data-table receipt-table">
        <thead>
          <tr>
            <th>Receipt</th>
            <th>Invoice</th>
            <th>Room</th>
            <th>Head Resident</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Created by</th>
            {hasActions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {receipts.map((receipt) => (
            <tr key={receipt.id}>
              <td>
                <strong>{receipt.receiptCode}</strong>
                <span className="table-subtext">{receipt.createdAt}</span>
              </td>
              <td>
                <strong>#{receipt.invoiceId}</strong>
                <span className="table-subtext">{receipt.invoiceMonth}</span>
              </td>
              <td>
                <strong>{receipt.roomCode}</strong>
                <span className="table-subtext">{receipt.buildingCode}</span>
              </td>
              <td>
                <strong>{receipt.residentHeadName}</strong>
                <span className="table-subtext">{receipt.residentHeadEmail}</span>
              </td>
              <td>{formatNumber(receipt.amount)}</td>
              <td>
                <span className={getReceiptStatusClass(receipt.status)}>
                  {getReceiptStatusLabel(receipt.status)}
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
      {receipts.length === 0 && <div className="empty-state flat-empty-state">No receipts found.</div>}
    </div>
  );
}
