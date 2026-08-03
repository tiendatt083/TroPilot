import DashboardMetricGrid from './DashboardMetricGrid.jsx';

/** Một khu vực dashboard có tiêu đề, mô tả, chỉ số và nội dung mở rộng. */
export default function DashboardSection({ title, description, metrics, children }) {
  const classes = [
    'dashboard-section-panel',
    metrics ? 'dashboard-section-panel-metrics' : '',
    children ? 'dashboard-section-panel-content' : ''
  ].filter(Boolean).join(' ');

  return (
    <section className={classes}>
      <div className="dashboard-section-header">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
      </div>
      {metrics && <DashboardMetricGrid metrics={metrics} />}
      {children}
    </section>
  );
}
