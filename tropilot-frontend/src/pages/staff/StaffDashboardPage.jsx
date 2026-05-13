import PageHeader from '../../components/PageHeader.jsx';

export default function StaffDashboardPage() {
  return (
    <section className="content-section">
      <PageHeader eyebrow="Operations staff" title="Dashboard" />
      <div className="empty-state">No dashboard data is available.</div>
    </section>
  );
}
