export default function DashboardMetricGrid({ metrics, compact = false }) {
  return (
    <div className={compact ? 'dashboard-grid compact-dashboard-grid' : 'dashboard-grid'}>
      {metrics.map((metric) => (
        <div
          className={[
            'dashboard-card',
            metric.tone ? `dashboard-card-${metric.tone}` : '',
            metric.featured ? 'dashboard-card-featured' : ''
          ].filter(Boolean).join(' ')}
          key={metric.label}
        >
          <span>{metric.label}</span>
          <strong>{metric.value}</strong>
          {metric.note && <small>{metric.note}</small>}
        </div>
      ))}
    </div>
  );
}
