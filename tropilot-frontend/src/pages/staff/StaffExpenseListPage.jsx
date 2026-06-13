import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as expenseApi from '../../features/payments/expenseApi.js';
import CashFlowSummary from '../../components/CashFlowSummary.jsx';
import ExpenseTable from '../../components/ExpenseTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { formatMonthInputValue } from '../../utils/dateFormat.js';

export default function StaffExpenseListPage() {
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
      setError(apiError.response?.data?.message || 'Expenses could not be loaded');
    }
  };

  useEffect(() => {
    loadData(month).finally(() => setLoading(false));
  }, []);

  const handleMonthSubmit = (event) => {
    event.preventDefault();
    loadData(month);
  };

  return (
    <section className="content-section">
      <div className="page-title-row">
        <PageHeader eyebrow="Operations staff" title="Expenses" />
        <Link className="button-link" to="/staff/expenses/create">
          Create expense
        </Link>
      </div>

      {error && <div className="alert error-alert">{error}</div>}

      <form className="month-filter-row" onSubmit={handleMonthSubmit}>
        <input type="month" lang="en-GB" value={month} onChange={(event) => setMonth(event.target.value)} required />
        <button className="inline-button" type="submit">
          View cash flow
        </button>
      </form>

      {loading ? (
        <div className="empty-state">Loading expenses...</div>
      ) : (
        <section className="expense-workspace">
          <CashFlowSummary cashFlow={cashFlow} />
          <ExpenseTable expenses={expenses} />
        </section>
      )}
    </section>
  );
}
