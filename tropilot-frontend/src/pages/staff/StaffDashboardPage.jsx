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

export default function StaffDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    dashboardApi
      .getStaffDashboard()
      .then((response) => {
        if (active) {
          setDashboard(response.data);
        }
      })
      .catch((apiError) => {
        if (active) {
          setError(apiError.response?.data?.message || 'Staff dashboard could not be loaded');
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

  const workloadMetrics = dashboard
    ? [
        { label: 'Assigned tasks', value: formatNumber(dashboard.assignedTasks), tone: 'primary', featured: true },
        { label: 'Overdue tasks', value: formatNumber(dashboard.overdueTasks), tone: 'danger' }
      ]
    : [];
  const operationsMetrics = dashboard
    ? [
        { label: 'Rooms needing utility reading', value: formatNumber(dashboard.roomsNeedingUtilityReading), tone: 'warning' },
        { label: 'Pending payment confirmations', value: formatNumber(dashboard.pendingPaymentConfirmations), tone: 'warning' },
        { label: 'Active maintenance requests', value: formatNumber(dashboard.activeMaintenanceRequests), tone: 'primary' }
      ]
    : [];
  const financeMetrics = dashboard
    ? [
        { label: 'Created expenses', value: formatNumber(dashboard.createdExpenses), tone: 'primary' }
      ]
    : [];
  const heroMetrics = dashboard
    ? [
        { label: 'Assigned tasks', value: formatNumber(dashboard.assignedTasks) },
        { label: 'Overdue tasks', value: formatNumber(dashboard.overdueTasks) },
        { label: 'Utility readings due', value: formatNumber(dashboard.roomsNeedingUtilityReading) },
        { label: 'Payment checks', value: formatNumber(dashboard.pendingPaymentConfirmations) }
      ]
    : [];

  return (
    <section className="content-section dashboard-page">
      <div className="dashboard-hero">
        <div>
          <PageHeader eyebrow="Operations staff" title="Dashboard" />
          <p>Daily work queue for readings, payments, maintenance, and assigned operational tasks.</p>
        </div>
        {dashboard && <DashboardMetricGrid metrics={heroMetrics} compact />}
      </div>

      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading dashboard...</div>
      ) : (
        <div className="dashboard-section-stack staff-dashboard-grid">
          <DashboardSection
            title="Task workload"
            description="Assigned work and overdue items requiring immediate action."
            metrics={workloadMetrics}
          />
          <DashboardSection
            title="Operational queue"
            description="Building operations that need staff processing."
            metrics={operationsMetrics}
          />
          <DashboardSection
            title="Expense activity"
            description="Expenses created from valid operational work."
            metrics={financeMetrics}
          />
        </div>
      )}
    </section>
  );
}
