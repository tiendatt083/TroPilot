export default function DashboardMetricGrid({ metrics }) {
  return (
    <div className="dashboard-grid">
      {metrics.map((metric) => (
        <div className="dashboard-card" key={metric.label}>
          <span>{metric.label}</span>
          <strong>{metric.value}</strong>
          {metric.note && <small>{metric.note}</small>}
        </div>
      ))}
    </div>
  );
}
