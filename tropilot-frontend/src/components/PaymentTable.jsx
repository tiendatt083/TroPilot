import { getPaymentStatusClass, getPaymentStatusLabel } from '../utils/paymentStatusOptions.js';
import { resolveFileUrl } from '../utils/fileUrl.js';
import { formatRoomCode } from '../utils/roomDisplay.js';

function formatNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;
}

export default function PaymentTable({ payments, renderActions }) {
  const hasActions = Boolean(renderActions);

  return (
    <div className="table-wrap">
      <table className="data-table payment-table">
        <thead>
          <tr>
            <th>Invoice</th>
            <th>Room</th>
            <th>Head Resident</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Proof</th>
            <th>Uploaded at</th>
            <th>Note</th>
            {hasActions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td>
                <strong>#{payment.invoiceId}</strong>
                <span className="table-subtext">{payment.invoiceMonth}</span>
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
                  {getPaymentStatusLabel(payment.status)}
                </span>
              </td>
              <td>
                <a className="secondary-link compact-link" href={resolveFileUrl(payment.proofImageUrl)} target="_blank" rel="noreferrer">
                  View
                </a>
              </td>
              <td>{payment.uploadedAt}</td>
              <td>{payment.note || 'Not provided'}</td>
              {hasActions && <td>{renderActions(payment)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
      {payments.length === 0 && <div className="empty-state flat-empty-state">No payments found.</div>}
    </div>
  );
}
