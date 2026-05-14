function formatNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;
}

export default function CashFlowSummary({ cashFlow }) {
  if (!cashFlow) {
    return <div className="empty-state">Cash flow data is not available.</div>;
  }

  return (
    <section className="cashflow-summary">
      <div>
        <span>Total income</span>
        <strong>{formatNumber(cashFlow.totalIncome)}</strong>
      </div>
      <div>
        <span>Total expense</span>
        <strong>{formatNumber(cashFlow.totalExpense)}</strong>
      </div>
      <div>
        <span>Remaining cash</span>
        <strong>{formatNumber(cashFlow.remainingCash)}</strong>
      </div>
      <div>
        <span>Unpaid amount</span>
        <strong>{formatNumber(cashFlow.unpaidAmount)}</strong>
      </div>
    </section>
  );
}
