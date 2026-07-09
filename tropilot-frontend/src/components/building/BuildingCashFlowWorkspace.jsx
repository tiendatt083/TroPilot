import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import CashFlowSummary from '../CashFlowSummary.jsx';
import ExpenseTable from '../ExpenseTable.jsx';
import LineIcon from '../common/LineIcon.jsx';
import ReceiptTable from '../ReceiptTable.jsx';
import { formatMonthInputValue } from '../../utils/dateFormat.js';

export default function BuildingCashFlowWorkspace({ getCashFlow, showReceipts = false }) {
  const { t } = useTranslation();
  const { building } = useOutletContext();
  const [cashFlow, setCashFlow] = useState(null);
  const [month, setMonth] = useState(formatMonthInputValue());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadCashFlow = async (targetMonth) => {
    setError('');

    try {
      const response = await getCashFlow(targetMonth, { buildingId: building.id });
      setCashFlow(response.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('workspace.cashFlow.loadError'));
    }
  };

  useEffect(() => {
    setLoading(true);
    loadCashFlow(month).finally(() => setLoading(false));
  }, [building.id]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setLoading(true);
    loadCashFlow(month).finally(() => setLoading(false));
  };

  return (
    <div className="building-workspace">
      <div className="building-section-header">
        <span className="page-eyebrow">{t('workspace.cashFlow.eyebrow')}</span>
      </div>

      {error && <div className="alert error-alert">{error}</div>}

      <form className="cashflow-filter-card" onSubmit={handleSubmit}>
        <label htmlFor="building-cashflow-month">
          <LineIcon name="calendar" />
          <span>{t('tables.common.month')}</span>
        </label>
        <input
          id="building-cashflow-month"
          type="month"
          lang="en-GB"
          value={month}
          onChange={(event) => setMonth(event.target.value)}
          required
        />
        <button className="secondary-button compact-button" type="submit" disabled={loading}>
          {t('workspace.cashFlow.view')}
        </button>
      </form>

      {loading ? (
        <div className="empty-state">{t('workspace.cashFlow.loading')}</div>
      ) : (
        <section className="cashflow-workspace">
          <CashFlowSummary cashFlow={cashFlow} />

          {showReceipts && (
            <section className="cashflow-record-section">
              <div className="cashflow-section-heading">
                <span>{t('workspace.cashFlow.income')}</span>
                <strong>{t('workspace.cashFlow.receipts')}</strong>
              </div>
              <ReceiptTable receipts={cashFlow?.receipts || []} />
            </section>
          )}

          <section className="cashflow-record-section">
            <div className="cashflow-section-heading">
              <span>{t('workspace.cashFlow.outgoing')}</span>
              <strong>{t('workspace.cashFlow.expenses')}</strong>
            </div>
            <ExpenseTable expenses={cashFlow?.expenses || []} />
          </section>
        </section>
      )}
    </div>
  );
}
