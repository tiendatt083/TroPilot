import DashboardMetricGrid from './DashboardMetricGrid.jsx';

export default function DashboardSection({ title, description, metrics, children }) {
  return (
    <section className="dashboard-section-panel">
      <div className="dashboard-section-header">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
      </div>
      {metrics && <DashboardMetricGrid metrics={metrics} compact />}
      {children}
    </section>
  );
}
