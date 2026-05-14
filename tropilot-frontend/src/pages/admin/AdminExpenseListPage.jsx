import { useEffect, useState } from 'react';
import * as expenseApi from '../../api/expenseApi.js';
import ExpenseTable from '../../components/ExpenseTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';

export default function AdminExpenseListPage() {
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
      setError(apiError.response?.data?.message || 'Expenses could not be loaded');
    }
  };

  useEffect(() => {
    loadExpenses().finally(() => setLoading(false));
  }, []);

  const handleCancel = async (expense) => {
    if (!window.confirm('Cancel this expense?')) {
      return;
    }

    setCancellingId(expense.id);
    setMessage('');
    setError('');

    try {
      await expenseApi.cancelAdminExpense(expense.id);
      setMessage('Expense cancelled successfully.');
      await loadExpenses();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Expense could not be cancelled');
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
      Cancel
    </button>
  );

  return (
    <section className="content-section">
      <PageHeader eyebrow="Administrator" title="Expenses" />

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading expenses...</div>
      ) : (
        <ExpenseTable expenses={expenses} renderActions={renderActions} />
      )}
    </section>
  );
}
