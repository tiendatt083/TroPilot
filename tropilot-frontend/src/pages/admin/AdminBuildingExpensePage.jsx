import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import * as expenseApi from '../../features/payments/expenseApi.js';
import ExpenseTable from '../../components/ExpenseTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';

export default function AdminBuildingExpensePage() {
  const { t } = useTranslation();
  const { building } = useOutletContext();
  const [expenses, setExpenses] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

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

  const renderActions = (expense) => (
    <button
      className="secondary-button compact-button"
      type="button"
      disabled={expense.status === 'CANCELLED' || cancellingId === expense.id}
      onClick={() => handleCancel(expense)}
    >
      {t('common.cancel')}
    </button>
  );

  return (
    <div className="building-workspace">
      <PageHeader eyebrow={t('workspace.expenses.eyebrow')} title={t('workspace.expenses.title')} />

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
