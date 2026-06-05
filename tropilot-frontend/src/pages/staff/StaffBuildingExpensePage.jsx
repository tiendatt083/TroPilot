import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import * as expenseApi from '../../api/expenseApi.js';
import * as roomApi from '../../api/roomApi.js';
import ExpenseForm from '../../components/ExpenseForm.jsx';
import ExpenseTable from '../../components/ExpenseTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';

export default function StaffBuildingExpensePage() {
  const { building } = useOutletContext();
  const [rooms, setRooms] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const buildingFilter = { buildingId: building.id };

  const loadData = async () => {
    setError('');

    try {
      const [roomsResponse, expensesResponse] = await Promise.all([
        roomApi.getStaffRooms(buildingFilter),
        expenseApi.getStaffExpenses(buildingFilter)
      ]);
      setRooms(roomsResponse.data);
      setExpenses(expensesResponse.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Expenses could not be loaded');
    }
  };

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [building.id]);

  const handleSubmit = async (payload) => {
    setCreating(true);
    setMessage('');
    setError('');

    try {
      await expenseApi.createStaffExpense(payload);
      setMessage('Expense created successfully.');
      await loadData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Expense could not be created');
      throw apiError;
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="building-workspace split-workspace">
      <section>
        <PageHeader eyebrow="Expense entry" title="Create expense" />
        {message && <div className="alert success-alert">{message}</div>}
        {error && <div className="alert error-alert">{error}</div>}
        {loading ? (
          <div className="empty-state">Loading rooms...</div>
        ) : (
          <ExpenseForm rooms={rooms} loading={creating} onSubmit={handleSubmit} />
        )}
      </section>

      <section>
        <PageHeader eyebrow="Outgoing money" title="Expenses in this building" />
        {loading ? <div className="empty-state">Loading expenses...</div> : <ExpenseTable expenses={expenses} />}
      </section>
    </div>
  );
}
