import PageHeader from '../../components/PageHeader.jsx';

export default function ResidentDashboardPage() {
  return (
    <section className="content-section">
      <PageHeader eyebrow="Head resident" title="Dashboard" />
      <div className="empty-state">No dashboard data is available.</div>
    </section>
  );
}
