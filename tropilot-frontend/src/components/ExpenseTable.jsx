import { useTranslation } from 'react-i18next';
import { getExpenseStatusClass } from '../utils/expenseOptions.js';
import { resolveFileUrl } from '../utils/fileUrl.js';
import { formatEnumLabel } from '../utils/i18nFormat.js';
import { formatRoomLabel } from '../utils/roomDisplay.js';

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

  return formatRoomLabel(expense);
}

export default function ExpenseTable({ expenses, renderActions }) {
  const { t } = useTranslation();
  const hasActions = Boolean(renderActions);

  return (
    <div className="table-wrap">
      <table className="data-table expense-table">
        <thead>
          <tr>
            <th>{t('tables.common.expense')}</th>
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
                <strong>{expense.expenseCode}</strong>
                <span className="table-subtext">{expense.createdAt}</span>
              </td>
              <td>
                <strong>{roomText(expense, t)}</strong>
                <span className="table-subtext">{expense.buildingCode || t('common.noBuilding')}</span>
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
                <span className="table-subtext">{expense.createdByRole}</span>
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
