import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import * as expenseApi from '../../features/payments/expenseApi.js';
import ExpenseTable from '../../components/ExpenseTable.jsx';

export default function AdminBuildingExpensePage() {
  const { t } = useTranslation();
  const { building } = useOutletContext();
  const [expenses, setExpenses] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [approvingId, setApprovingId] = useState(null);

  const buildingFilter = { buildingId: building.id };

  const loadExpenses = async () => {
    setError('');

    try {
      const response = await expenseApi.getAdminExpenses(buildingFilter);
      setExpenses(response.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('workspace.expenses.loadError'));
    }
  };

  useEffect(() => {
    setLoading(true);
    loadExpenses().finally(() => setLoading(false));
  }, [building.id]);

  const handleCancel = async (expense) => {
    if (!window.confirm(t('workspace.expenses.cancelConfirm'))) {
      return;
    }

    setCancellingId(expense.id);
    setMessage('');
    setError('');

    try {
      await expenseApi.cancelAdminExpense(expense.id, buildingFilter);
      setMessage(t('workspace.expenses.cancelled'));
      await loadExpenses();
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('workspace.expenses.cancelError'));
    } finally {
      setCancellingId(null);
    }
  };

  const handleApprove = async (expense) => {
    setApprovingId(expense.id);
    setMessage('');
    setError('');

    try {
      await expenseApi.approveAdminExpense(expense.id, buildingFilter);
      setMessage(t('workspace.expenses.approved'));
      await loadExpenses();
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('workspace.expenses.approveError'));
    } finally {
      setApprovingId(null);
    }
  };

  const renderActions = (expense) => (
    <div className="table-action-group icon-table-actions">
      {expense.status === 'PENDING' && (
        <button
          aria-label={t('common.approve')}
          className="icon-action-button icon-action-success"
          data-tooltip={t('common.approve')}
          type="button"
          disabled={approvingId === expense.id}
          onClick={() => handleApprove(expense)}
        >
          <CheckIcon />
        </button>
      )}
      <button
        aria-label={t('common.cancel')}
        className="icon-action-button icon-action-danger"
        data-tooltip={t('common.cancel')}
        type="button"
        disabled={expense.status === 'CANCELLED' || cancellingId === expense.id}
        onClick={() => handleCancel(expense)}
      >
        <XIcon />
      </button>
    </div>
  );

  return (
    <div className="building-workspace">
      <div className="building-section-header">
        <span className="page-eyebrow">{t('workspace.expenses.eyebrow')}</span>
      </div>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('workspace.expenses.loading')}</div>
      ) : (
        <ExpenseTable expenses={expenses} renderActions={renderActions} />
      )}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
