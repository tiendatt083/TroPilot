import { useEffect, useState } from 'react';
import * as dashboardApi from '../../api/dashboardApi.js';
import DashboardMetricGrid from '../../components/DashboardMetricGrid.jsx';
import PageHeader from '../../components/PageHeader.jsx';

function formatNumber(value) {
  const numberValue = Number(value ?? 0);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;
}

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    dashboardApi
      .getAdminDashboard()
      .then((response) => {
        if (active) {
          setDashboard(response.data);
        }
      })
      .catch((apiError) => {
        if (active) {
          setError(apiError.response?.data?.message || 'Admin dashboard could not be loaded');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const metrics = dashboard
    ? [
        { label: 'Total buildings', value: formatNumber(dashboard.totalBuildings) },
        { label: 'Total rooms', value: formatNumber(dashboard.totalRooms) },
        { label: 'Empty rooms', value: formatNumber(dashboard.emptyRooms) },
        { label: 'Occupied rooms', value: formatNumber(dashboard.occupiedRooms) },
        { label: 'Maintenance rooms', value: formatNumber(dashboard.maintenanceRooms) },
        { label: 'Head residents', value: formatNumber(dashboard.totalHeadResidents) },
        { label: 'Approved room members', value: formatNumber(dashboard.totalApprovedRoomMembers) },
        { label: 'Total occupants', value: formatNumber(dashboard.totalOccupants) },
        { label: 'Active vehicles', value: formatNumber(dashboard.totalActiveVehicles) },
        { label: 'Expiring contracts', value: formatNumber(dashboard.expiringContracts), note: 'Next 30 days' },
        { label: 'Unpaid invoices', value: formatNumber(dashboard.unpaidInvoices) },
        { label: 'Overdue invoices', value: formatNumber(dashboard.overdueInvoices) },
        { label: 'Total income', value: formatNumber(dashboard.totalIncome) },
        { label: 'Unpaid amount', value: formatNumber(dashboard.unpaidAmount) },
        { label: 'Total expense', value: formatNumber(dashboard.totalExpense) },
        { label: 'Remaining cash', value: formatNumber(dashboard.remainingCash) },
        { label: 'Pending maintenance', value: formatNumber(dashboard.pendingMaintenanceRequests) },
        { label: 'In-progress tasks', value: formatNumber(dashboard.inProgressTasks) },
        { label: 'Unresolved feedbacks', value: formatNumber(dashboard.unresolvedFeedbacks) }
      ]
    : [];

  return (
    <section className="content-section">
      <PageHeader eyebrow="Administrator" title="Dashboard" />

      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading dashboard...</div>
      ) : (
        <DashboardMetricGrid metrics={metrics} />
      )}
    </section>
  );
}
