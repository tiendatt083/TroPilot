import PageHeader from '../../components/PageHeader.jsx';

export default function AdminDashboardPage() {
  return (
    <section className="content-section">
      <PageHeader eyebrow="Administrator" title="Dashboard" />
      <div className="empty-state">No dashboard data is available.</div>
    </section>
  );
}
