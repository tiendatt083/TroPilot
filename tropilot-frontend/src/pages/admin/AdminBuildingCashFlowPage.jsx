import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import * as expenseApi from '../../api/expenseApi.js';
import CashFlowSummary from '../../components/CashFlowSummary.jsx';
import ExpenseTable from '../../components/ExpenseTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import ReceiptTable from '../../components/ReceiptTable.jsx';

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export default function AdminBuildingCashFlowPage() {
  const { building } = useOutletContext();
  const [cashFlow, setCashFlow] = useState(null);
  const [month, setMonth] = useState(currentMonth());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const buildingFilter = { buildingId: building.id };

  const loadCashFlow = async (targetMonth) => {
    setError('');

    try {
      const response = await expenseApi.getAdminCashFlow(targetMonth, buildingFilter);
      setCashFlow(response.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Building cash flow could not be loaded');
    }
  };

  useEffect(() => {
    setLoading(true);
    loadCashFlow(month).finally(() => setLoading(false));
  }, [building.id]);

  const handleSubmit = (event) => {
    event.preventDefault();
    loadCashFlow(month);
  };

  return (
    <div className="building-workspace">
      <PageHeader eyebrow="Building cash flow" title="Cash flow in this building" />

      {error && <div className="alert error-alert">{error}</div>}

      <form className="month-filter-row" onSubmit={handleSubmit}>
        <input type="month" lang="en-GB" value={month} onChange={(event) => setMonth(event.target.value)} required />
        <button className="inline-button" type="submit">
          View cash flow
        </button>
      </form>

      {loading ? (
        <div className="empty-state">Loading cash flow...</div>
      ) : (
        <section className="cashflow-workspace">
          <CashFlowSummary cashFlow={cashFlow} />

          <div>
            <PageHeader eyebrow="Income" title="Valid receipts" />
            <ReceiptTable receipts={cashFlow?.receipts || []} />
          </div>

          <div>
            <PageHeader eyebrow="Outgoing money" title="Valid expenses" />
            <ExpenseTable expenses={cashFlow?.expenses || []} />
          </div>
        </section>
      )}
    </div>
  );
}
