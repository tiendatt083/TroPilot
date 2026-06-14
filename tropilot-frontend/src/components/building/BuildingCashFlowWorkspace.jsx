import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import CashFlowSummary from '../CashFlowSummary.jsx';
import ExpenseTable from '../ExpenseTable.jsx';
import PageHeader from '../PageHeader.jsx';
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
    loadCashFlow(month);
  };

  return (
    <div className="building-workspace">
      <PageHeader eyebrow={t('workspace.cashFlow.eyebrow')} title={t('workspace.cashFlow.title')} />

      {error && <div className="alert error-alert">{error}</div>}

      <form className="month-filter-row" onSubmit={handleSubmit}>
        <input type="month" lang="en-GB" value={month} onChange={(event) => setMonth(event.target.value)} required />
        <button className="inline-button" type="submit">
          {t('workspace.cashFlow.view')}
        </button>
      </form>

      {loading ? (
        <div className="empty-state">{t('workspace.cashFlow.loading')}</div>
      ) : (
        <section className="cashflow-workspace">
          <CashFlowSummary cashFlow={cashFlow} />

          {showReceipts && (
            <div>
              <PageHeader eyebrow={t('workspace.cashFlow.income')} title={t('workspace.cashFlow.receipts')} />
              <ReceiptTable receipts={cashFlow?.receipts || []} />
            </div>
          )}

          <div>
            <PageHeader eyebrow={t('workspace.cashFlow.outgoing')} title={t('workspace.cashFlow.expenses')} />
            <ExpenseTable expenses={cashFlow?.expenses || []} />
          </div>
        </section>
      )}
    </div>
  );
}
