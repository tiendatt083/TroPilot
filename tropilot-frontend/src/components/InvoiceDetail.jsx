import { getInvoiceStatusClass, getInvoiceStatusLabel } from '../utils/invoiceStatusOptions.js';

function formatNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;
}

export default function InvoiceDetail({ invoice }) {
  if (!invoice) {
    return <div className="empty-state">Select an invoice to view details.</div>;
  }

  return (
    <section className="invoice-detail-panel">
      <div className="detail-panel">
        <div>
          <span>Room</span>
          <strong>
            {invoice.roomCode} - {invoice.roomName}
          </strong>
        </div>
        <div>
          <span>Building</span>
          <strong>
            {invoice.buildingCode} - {invoice.buildingName}
          </strong>
        </div>
        <div>
          <span>Head Resident</span>
          <strong>{invoice.residentHeadName}</strong>
        </div>
        <div>
          <span>Month</span>
          <strong>{invoice.month}</strong>
        </div>
        <div>
          <span>Due date</span>
          <strong>{invoice.dueDate}</strong>
        </div>
        <div>
          <span>Status</span>
          <strong>
            <span className={getInvoiceStatusClass(invoice.status)}>
              {getInvoiceStatusLabel(invoice.status)}
            </span>
          </strong>
        </div>
        <div>
          <span>Total amount</span>
          <strong>{formatNumber(invoice.totalAmount)}</strong>
        </div>
        <div>
          <span>Created by</span>
          <strong>{invoice.createdByName}</strong>
        </div>
      </div>

      <div className="invoice-evidence-row">
        {invoice.electricityImageUrl && (
          <a className="secondary-link compact-link" href={invoice.electricityImageUrl} target="_blank" rel="noreferrer">
            Electricity evidence
          </a>
        )}
        {invoice.waterImageUrl && (
          <a className="secondary-link compact-link" href={invoice.waterImageUrl} target="_blank" rel="noreferrer">
            Water evidence
          </a>
        )}
      </div>

      <div className="table-wrap">
        <table className="data-table invoice-item-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Unit price</th>
              <th>Amount</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.items || []).map((item) => (
              <tr key={item.id || item.itemName}>
                <td>{item.itemName}</td>
                <td>{formatNumber(item.quantity)}</td>
                <td>{formatNumber(item.unitPrice)}</td>
                <td>{formatNumber(item.amount)}</td>
                <td>{item.note || 'Not provided'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(invoice.items || []).length === 0 && <div className="empty-state flat-empty-state">No invoice items found.</div>}
      </div>
    </section>
  );
}
