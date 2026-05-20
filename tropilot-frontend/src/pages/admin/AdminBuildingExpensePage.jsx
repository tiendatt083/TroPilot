import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import * as expenseApi from '../../api/expenseApi.js';
import ExpenseTable from '../../components/ExpenseTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';

export default function AdminBuildingExpensePage() {
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
      setError(apiError.response?.data?.message || 'Building expenses could not be loaded');
    }
  };

  useEffect(() => {
    setLoading(true);
    loadExpenses().finally(() => setLoading(false));
  }, [building.id]);

  const handleCancel = async (expense) => {
    if (!window.confirm('Cancel this expense?')) {
      return;
    }

    setCancellingId(expense.id);
    setMessage('');
    setError('');

    try {
      await expenseApi.cancelAdminExpense(expense.id, buildingFilter);
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
    <div className="building-workspace">
      <PageHeader eyebrow="Building expenses" title="Expenses in this building" />

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading expenses...</div>
      ) : (
        <ExpenseTable expenses={expenses} renderActions={renderActions} />
      )}
    </div>
  );
}
