import { useTranslation } from 'react-i18next';

function formatNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;
}

export default function CashFlowSummary({ cashFlow }) {
  const { t } = useTranslation();

  if (!cashFlow) {
    return <div className="empty-state">{t('cashFlow.unavailable')}</div>;
  }

  return (
    <section className="cashflow-summary">
      <div>
        <span>{t('cashFlow.totalIncome')}</span>
        <strong>{formatNumber(cashFlow.totalIncome)}</strong>
      </div>
      <div>
        <span>{t('cashFlow.totalExpense')}</span>
        <strong>{formatNumber(cashFlow.totalExpense)}</strong>
      </div>
      <div>
        <span>{t('cashFlow.remainingCash')}</span>
        <strong>{formatNumber(cashFlow.remainingCash)}</strong>
      </div>
      <div>
        <span>{t('cashFlow.unpaidAmount')}</span>
        <strong>{formatNumber(cashFlow.unpaidAmount)}</strong>
      </div>
    </section>
  );
}
