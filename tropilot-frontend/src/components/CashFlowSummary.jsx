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

  const metrics = [
    {
      key: 'income',
      label: t('cashFlow.totalIncome'),
      value: cashFlow.totalIncome
    },
    {
      key: 'expense',
      label: t('cashFlow.totalExpense'),
      value: cashFlow.totalExpense
    },
    {
      key: 'remaining',
      label: t('cashFlow.remainingCash'),
      value: cashFlow.remainingCash
    },
    {
      key: 'unpaid',
      label: t('cashFlow.unpaidAmount'),
      value: cashFlow.unpaidAmount
    }
  ];

  return (
    <section className="cashflow-summary">
      {metrics.map((metric) => (
        <div className={`cashflow-metric cashflow-metric-${metric.key}`} key={metric.key}>
          <span>{metric.label}</span>
          <strong>{formatNumber(metric.value)}</strong>
        </div>
      ))}
    </section>
  );
}
