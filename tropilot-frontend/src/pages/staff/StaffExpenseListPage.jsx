import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import * as expenseApi from '../../features/payments/expenseApi.js';
import CashFlowSummary from '../../components/CashFlowSummary.jsx';
import ExpenseTable from '../../components/ExpenseTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { formatMonthInputValue } from '../../utils/dateFormat.js';

export default function StaffExpenseListPage() {
  const { t } = useTranslation();
  const [expenses, setExpenses] = useState([]);
  const [cashFlow, setCashFlow] = useState(null);
  const [month, setMonth] = useState(formatMonthInputValue());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async (targetMonth) => {
    setError('');

    try {
      const [expensesResponse, cashFlowResponse] = await Promise.all([
        expenseApi.getStaffExpenses(),
        expenseApi.getStaffCashFlow(targetMonth)
      ]);
      setExpenses(expensesResponse.data);
      setCashFlow(cashFlowResponse.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('expenseManagement.loadError'));
    }
  };

  useEffect(() => {
    loadData(month).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setLoading(true);
    loadData(month).finally(() => setLoading(false));
  }, [month]);

  return (
    <section className="content-section">
      <div className="page-title-row">
        <PageHeader eyebrow={t('role.staff')} title={t('expenseManagement.title')} />
        <Link className="button-link" to="/staff/expenses/create">
          {t('expenseManagement.create')}
        </Link>
      </div>

      {error && <div className="alert error-alert">{error}</div>}

      <div className="month-filter-row">
        <input type="month" lang="en-GB" value={month} onChange={(event) => setMonth(event.target.value)} required />
      </div>

      {loading ? (
        <div className="empty-state">{t('expenseManagement.loading')}</div>
      ) : (
        <section className="expense-workspace">
          <CashFlowSummary cashFlow={cashFlow} />
          <ExpenseTable expenses={expenses} />
        </section>
      )}
    </section>
  );
}
