import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as expenseApi from '../../features/payments/expenseApi.js';
import ExpenseTable from '../../components/ExpenseTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';

export default function AdminExpenseListPage() {
  const { t } = useTranslation();
  const [expenses, setExpenses] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  const loadExpenses = async () => {
    setError('');

    try {
      const response = await expenseApi.getAdminExpenses();
      setExpenses(response.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('expenseManagement.loadError'));
    }
  };

  useEffect(() => {
    loadExpenses().finally(() => setLoading(false));
  }, []);

  const handleCancel = async (expense) => {
    if (!window.confirm(t('expenseManagement.cancelConfirm'))) {
      return;
    }

    setCancellingId(expense.id);
    setMessage('');
    setError('');

    try {
      await expenseApi.cancelAdminExpense(expense.id);
      setMessage(t('expenseManagement.cancelled'));
      await loadExpenses();
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('expenseManagement.cancelError'));
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
      {t('expenseManagement.cancel')}
    </button>
  );

  return (
    <section className="content-section">
      <PageHeader eyebrow={t('role.admin')} title={t('expenseManagement.title')} />

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('expenseManagement.loading')}</div>
      ) : (
        <ExpenseTable expenses={expenses} renderActions={renderActions} />
      )}
    </section>
  );
}
