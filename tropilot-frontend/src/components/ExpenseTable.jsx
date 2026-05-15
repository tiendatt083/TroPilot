import {
  getExpenseStatusClass,
  getExpenseStatusLabel,
  getExpenseTypeLabel
} from '../utils/expenseOptions.js';
import { resolveFileUrl } from '../utils/fileUrl.js';

function formatNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;
}

function roomText(expense) {
  if (!expense.roomCode) {
    return 'Not linked';
  }

  return `${expense.roomCode} - ${expense.roomName}`;
}

export default function ExpenseTable({ expenses, renderActions }) {
  const hasActions = Boolean(renderActions);

  return (
    <div className="table-wrap">
      <table className="data-table expense-table">
        <thead>
          <tr>
            <th>Expense</th>
            <th>Room</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Proof</th>
            <th>Created by</th>
            <th>Content</th>
            {hasActions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => (
            <tr key={expense.id}>
              <td>
                <strong>{expense.expenseCode}</strong>
                <span className="table-subtext">{expense.createdAt}</span>
              </td>
              <td>
                <strong>{roomText(expense)}</strong>
                <span className="table-subtext">{expense.buildingCode || 'No building'}</span>
              </td>
              <td>{getExpenseTypeLabel(expense.expenseType)}</td>
              <td>{formatNumber(expense.amount)}</td>
              <td>
                <span className={getExpenseStatusClass(expense.status)}>
                  {getExpenseStatusLabel(expense.status)}
                </span>
              </td>
              <td>
                {expense.proofImageUrl ? (
                  <a className="secondary-link compact-link" href={resolveFileUrl(expense.proofImageUrl)} target="_blank" rel="noreferrer">
                    View
                  </a>
                ) : (
                  'Not provided'
                )}
              </td>
              <td>
                <strong>{expense.createdByName}</strong>
                <span className="table-subtext">{expense.createdByRole}</span>
              </td>
              <td>{expense.content}</td>
              {hasActions && <td>{renderActions(expense)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
      {expenses.length === 0 && <div className="empty-state flat-empty-state">No expenses found.</div>}
    </div>
  );
}
