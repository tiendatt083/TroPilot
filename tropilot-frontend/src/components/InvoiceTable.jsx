import { Link } from 'react-router-dom';
import { getInvoiceStatusClass, getInvoiceStatusLabel } from '../utils/invoiceStatusOptions.js';
import { formatRoomCode } from '../utils/roomDisplay.js';

function formatNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;
}

export default function InvoiceTable({ invoices, renderActions, detailPathBase }) {
  const hasActions = Boolean(renderActions || detailPathBase);

  return (
    <div className="table-wrap">
      <table className="data-table invoice-table">
        <thead>
          <tr>
            <th>Room</th>
            <th>Head Resident</th>
            <th>Month</th>
            <th>Due date</th>
            <th>Status</th>
            <th>Total amount</th>
            {hasActions && <th>Actions</th>}
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
              <td>{invoice.month}</td>
              <td>{invoice.dueDate}</td>
              <td>
                <span className={getInvoiceStatusClass(invoice.status)}>
                  {getInvoiceStatusLabel(invoice.status)}
                </span>
              </td>
              <td>{formatNumber(invoice.totalAmount)}</td>
              {hasActions && (
                <td>
                  {detailPathBase ? (
                    <Link className="secondary-link compact-link" to={`${detailPathBase}/${invoice.id}`}>
                      View
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
      {invoices.length === 0 && <div className="empty-state flat-empty-state">No invoices found.</div>}
    </div>
  );
}
