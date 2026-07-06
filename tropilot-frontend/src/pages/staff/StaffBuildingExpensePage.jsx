import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as expenseApi from '../../features/payments/expenseApi.js';
import * as roomApi from '../../features/rooms/api.js';
import ExpenseForm from '../../components/ExpenseForm.jsx';
import ExpenseTable from '../../components/ExpenseTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { translateInterfaceText } from '../../utils/interfaceTranslations.js';

export default function StaffBuildingExpensePage() {
  useTranslation();
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
      setError(translateInterfaceText(apiError.response?.data?.message || 'Expenses could not be loaded'));
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
      setMessage(translateInterfaceText('Expense created successfully.'));
      await loadData();
    } catch (apiError) {
      setError(translateInterfaceText(apiError.response?.data?.message || 'Expense could not be created'));
      throw apiError;
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="building-workspace split-workspace">
      <section>
        <PageHeader eyebrow={translateInterfaceText('Expense entry')} title={translateInterfaceText('Create expense')} />
        {message && <div className="alert success-alert">{message}</div>}
        {error && <div className="alert error-alert">{error}</div>}
        {loading ? (
          <div className="empty-state">{translateInterfaceText('Loading rooms...')}</div>
        ) : (
          <ExpenseForm rooms={rooms} loading={creating} onSubmit={handleSubmit} />
        )}
      </section>

      <section>
        <PageHeader eyebrow={translateInterfaceText('Outgoing money')} title={translateInterfaceText('Expenses in this building')} />
        {loading ? <div className="empty-state">{translateInterfaceText('Loading expenses...')}</div> : <ExpenseTable expenses={expenses} />}
      </section>
    </div>
  );
}
