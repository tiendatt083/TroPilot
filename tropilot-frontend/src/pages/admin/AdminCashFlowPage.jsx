import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as expenseApi from '../../features/payments/expenseApi.js';
import CashFlowSummary from '../../components/CashFlowSummary.jsx';
import ExpenseTable from '../../components/ExpenseTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import ReceiptTable from '../../components/ReceiptTable.jsx';
import { formatMonthInputValue } from '../../utils/dateFormat.js';

export default function AdminCashFlowPage() {
  const { t } = useTranslation();
  const [cashFlow, setCashFlow] = useState(null);
  const [month, setMonth] = useState(formatMonthInputValue());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadCashFlow = async (targetMonth) => {
    setError('');

    try {
      const response = await expenseApi.getAdminCashFlow(targetMonth);
      setCashFlow(response.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('workspace.cashFlow.loadError'));
    }
  };

  useEffect(() => {
    loadCashFlow(month).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setLoading(true);
    loadCashFlow(month).finally(() => setLoading(false));
  }, [month]);

  return (
    <section className="content-section">
      <PageHeader eyebrow={t('contracts.adminEyebrow')} title={t('navigation.cashFlow', { defaultValue: t('workspace.cashFlow.title') })} />

      {error && <div className="alert error-alert">{error}</div>}

      <div className="month-filter-row">
        <input type="month" lang="en-GB" value={month} onChange={(event) => setMonth(event.target.value)} required />
      </div>

      {loading ? (
        <div className="empty-state">{t('workspace.cashFlow.loading')}</div>
      ) : (
        <section className="cashflow-workspace">
          <CashFlowSummary cashFlow={cashFlow} />

          <div>
            <PageHeader eyebrow={t('workspace.cashFlow.income')} title={t('workspace.cashFlow.receipts')} />
            <ReceiptTable receipts={cashFlow?.receipts || []} />
          </div>

          <div>
            <PageHeader eyebrow={t('workspace.cashFlow.outgoing')} title={t('workspace.cashFlow.expenses')} />
            <ExpenseTable expenses={cashFlow?.expenses || []} />
          </div>
        </section>
      )}
    </section>
  );
}
