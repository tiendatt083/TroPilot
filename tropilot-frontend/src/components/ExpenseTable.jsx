import { useTranslation } from 'react-i18next';
import { getExpenseStatusClass } from '../utils/expenseOptions.js';
import { resolveFileUrl } from '../utils/fileUrl.js';
import { formatDisplayDateTime } from '../utils/dateFormat.js';
import { formatEnumLabel } from '../utils/i18nFormat.js';
import { formatRoomCode } from '../utils/roomDisplay.js';

function formatNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;
}

function roomText(expense, t) {
  if (!expense.roomCode) {
    return t('common.notLinked');
  }

  return formatRoomCode(expense);
}

function formatExpenseCode(expenseCode) {
  const normalizedCode = String(expenseCode || '').trim();

  if (!normalizedCode) {
    return '';
  }

  const parts = normalizedCode.split('-').filter(Boolean);

  if (parts.length >= 3) {
    return `${parts[0]}-${parts[parts.length - 1]}`;
  }

  return normalizedCode.length > 18
    ? `${normalizedCode.slice(0, 6)}...${normalizedCode.slice(-8)}`
    : normalizedCode;
}

export default function ExpenseTable({ expenses, renderActions }) {
  const { t } = useTranslation();
  const hasActions = Boolean(renderActions);

  return (
    <div className="table-wrap">
      <table className="data-table expense-table">
        <thead>
          <tr>
            <th>{t('tables.common.expenseCode')}</th>
            <th>{t('tables.common.room')}</th>
            <th>{t('tables.common.type')}</th>
            <th>{t('tables.common.amount')}</th>
            <th>{t('tables.common.status')}</th>
            <th>{t('tables.common.proof')}</th>
            <th>{t('tables.common.createdBy')}</th>
            <th>{t('tables.common.content')}</th>
            {hasActions && <th>{t('tables.common.actions')}</th>}
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => (
            <tr key={expense.id}>
              <td>
                <strong title={expense.expenseCode}>{formatExpenseCode(expense.expenseCode)}</strong>
                <span className="table-subtext">{formatDisplayDateTime(expense.createdAt)}</span>
              </td>
              <td>
                <strong>{roomText(expense, t)}</strong>
              </td>
              <td>{formatEnumLabel(t, 'expenseType', expense.expenseType)}</td>
              <td>{formatNumber(expense.amount)}</td>
              <td>
                <span className={getExpenseStatusClass(expense.status)}>
                  {formatEnumLabel(t, 'expenseStatus', expense.status)}
                </span>
              </td>
              <td>
                {expense.proofImageUrl ? (
                  <a className="secondary-link compact-link" href={resolveFileUrl(expense.proofImageUrl)} target="_blank" rel="noreferrer">
                    {t('common.view')}
                  </a>
                ) : (
                  t('common.notProvided')
                )}
              </td>
              <td>
                <strong>{expense.createdByName}</strong>
              </td>
              <td>{expense.content}</td>
              {hasActions && <td>{renderActions(expense)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
      {expenses.length === 0 && <div className="empty-state flat-empty-state">{t('tables.expenses.empty')}</div>}
    </div>
  );
}
