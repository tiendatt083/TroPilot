import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import * as expenseApi from '../../features/payments/expenseApi.js';
import * as roomApi from '../../features/rooms/api.js';
import ExpenseForm from '../../components/ExpenseForm.jsx';
import PageHeader from '../../components/PageHeader.jsx';

export default function StaffExpenseCreatePage() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    roomApi
      .getStaffRooms()
      .then((response) => setRooms(response.data))
      .catch((apiError) => setError(apiError.response?.data?.message || t('expenseManagement.roomsLoadError')))
      .finally(() => setLoadingRooms(false));
  }, []);

  const handleSubmit = async (payload) => {
    setCreating(true);
    setError('');

    try {
      await expenseApi.createStaffExpense(payload);
      navigate('/staff/expenses', { replace: true });
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('expenseManagement.createError'));
      throw apiError;
    } finally {
      setCreating(false);
    }
  };

  if (loadingRooms) {
    return <div className="empty-state">{t('expenseManagement.loadingRooms')}</div>;
  }

  return (
    <section className="content-section narrow-section">
      <div className="page-title-row">
        <PageHeader eyebrow={t('role.staff')} title={t('expenseManagement.createTitle')} />
        <Link className="secondary-link" to="/staff/expenses">
          {t('expenseManagement.back')}
        </Link>
      </div>

      {error && <div className="alert error-alert">{error}</div>}

      <ExpenseForm
        initialValues={location.state}
        rooms={rooms}
        loading={creating}
        onSubmit={handleSubmit}
      />
    </section>
  );
}
