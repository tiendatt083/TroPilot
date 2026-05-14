import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as expenseApi from '../../api/expenseApi.js';
import * as roomApi from '../../api/roomApi.js';
import ExpenseForm from '../../components/ExpenseForm.jsx';
import PageHeader from '../../components/PageHeader.jsx';

export default function StaffExpenseCreatePage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    roomApi
      .getStaffRooms()
      .then((response) => setRooms(response.data))
      .catch((apiError) => setError(apiError.response?.data?.message || 'Rooms could not be loaded'))
      .finally(() => setLoadingRooms(false));
  }, []);

  const handleSubmit = async (payload) => {
    setCreating(true);
    setError('');

    try {
      await expenseApi.createStaffExpense(payload);
      navigate('/staff/expenses', { replace: true });
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Expense could not be created');
      throw apiError;
    } finally {
      setCreating(false);
    }
  };

  if (loadingRooms) {
    return <div className="empty-state">Loading rooms...</div>;
  }

  return (
    <section className="content-section narrow-section">
      <div className="page-title-row">
        <PageHeader eyebrow="Operations staff" title="Create expense" />
        <Link className="secondary-link" to="/staff/expenses">
          Back to expenses
        </Link>
      </div>

      {error && <div className="alert error-alert">{error}</div>}

      <ExpenseForm rooms={rooms} loading={creating} onSubmit={handleSubmit} />
    </section>
  );
}
