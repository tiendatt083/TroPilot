import { useEffect, useState } from 'react';
import * as dashboardApi from '../../api/dashboardApi.js';
import DashboardMetricGrid from '../../components/DashboardMetricGrid.jsx';
import DashboardSection from '../../components/DashboardSection.jsx';
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

  const portfolioMetrics = dashboard
    ? [
        { label: 'Total buildings', value: formatNumber(dashboard.totalBuildings), tone: 'primary' },
        { label: 'Total rooms', value: formatNumber(dashboard.totalRooms), tone: 'primary' },
        { label: 'Occupied rooms', value: formatNumber(dashboard.occupiedRooms), tone: 'success' },
        { label: 'Empty rooms', value: formatNumber(dashboard.emptyRooms) },
        { label: 'Maintenance rooms', value: formatNumber(dashboard.maintenanceRooms), tone: 'warning' }
      ]
    : [];
  const residentMetrics = dashboard
    ? [
        { label: 'Head residents', value: formatNumber(dashboard.totalHeadResidents), tone: 'primary' },
        { label: 'Approved room members', value: formatNumber(dashboard.totalApprovedRoomMembers) },
        { label: 'Pending room members', value: formatNumber(dashboard.totalPendingRoomMembers), tone: 'warning' },
        { label: 'Total occupants', value: formatNumber(dashboard.totalOccupants), tone: 'success' },
        { label: 'Active vehicles', value: formatNumber(dashboard.totalActiveVehicles) }
      ]
    : [];
  const financeMetrics = dashboard
    ? [
        { label: 'Total income', value: formatNumber(dashboard.totalIncome), tone: 'success', featured: true },
        { label: 'Total expense', value: formatNumber(dashboard.totalExpense), tone: 'danger' },
        { label: 'Remaining cash', value: formatNumber(dashboard.remainingCash), tone: 'primary', featured: true },
        { label: 'Unpaid amount', value: formatNumber(dashboard.unpaidAmount), tone: 'warning' }
      ]
    : [];
  const attentionMetrics = dashboard
    ? [
        { label: 'Expiring contracts', value: formatNumber(dashboard.expiringContracts), note: 'Next 30 days', tone: 'warning' },
        { label: 'Unpaid invoices', value: formatNumber(dashboard.unpaidInvoices), tone: 'warning' },
        { label: 'Overdue invoices', value: formatNumber(dashboard.overdueInvoices), tone: 'danger' },
        { label: 'Pending maintenance', value: formatNumber(dashboard.pendingMaintenanceRequests), tone: 'warning' },
        { label: 'In-progress tasks', value: formatNumber(dashboard.inProgressTasks), tone: 'primary' },
        { label: 'Unresolved feedbacks', value: formatNumber(dashboard.unresolvedFeedbacks), tone: 'warning' }
      ]
    : [];
  const heroMetrics = dashboard
    ? [
        { label: 'Buildings', value: formatNumber(dashboard.totalBuildings) },
        { label: 'Rooms', value: formatNumber(dashboard.totalRooms) },
        { label: 'Open issues', value: formatNumber((dashboard.pendingMaintenanceRequests || 0) + (dashboard.unresolvedFeedbacks || 0)) },
        { label: 'Cash position', value: formatNumber(dashboard.remainingCash) }
      ]
    : [];

  return (
    <section className="content-section dashboard-page">
      <div className="dashboard-hero">
        <div>
          <PageHeader eyebrow="Administrator" title="Dashboard" />
          <p>System-wide operating snapshot for buildings, rooms, residents, invoices, maintenance, and cash flow.</p>
        </div>
        {dashboard && <DashboardMetricGrid metrics={heroMetrics} compact />}
      </div>

      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading dashboard...</div>
      ) : (
        <div className="dashboard-section-stack">
          <DashboardSection
            title="Portfolio overview"
            description="Room supply and occupancy health across all buildings."
            metrics={portfolioMetrics}
          />
          <DashboardSection
            title="Residents and vehicles"
            description="Current resident coverage and vehicle volume."
            metrics={residentMetrics}
          />
          <DashboardSection
            title="Financial position"
            description="Income, expense, outstanding amount, and remaining cash from real records."
            metrics={financeMetrics}
          />
          <DashboardSection
            title="Attention required"
            description="Items that need review or operational follow-up."
            metrics={attentionMetrics}
          />
        </div>
      )}
    </section>
  );
}
