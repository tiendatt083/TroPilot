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

  const metrics = dashboard
    ? [
        { label: 'Assigned tasks', value: formatNumber(dashboard.assignedTasks) },
        { label: 'Overdue tasks', value: formatNumber(dashboard.overdueTasks) },
        { label: 'Rooms needing utility reading', value: formatNumber(dashboard.roomsNeedingUtilityReading) },
        { label: 'Pending payment confirmations', value: formatNumber(dashboard.pendingPaymentConfirmations) },
        { label: 'Active maintenance requests', value: formatNumber(dashboard.activeMaintenanceRequests) },
        { label: 'Created expenses', value: formatNumber(dashboard.createdExpenses) }
      ]
    : [];

  return (
    <section className="content-section">
      <PageHeader eyebrow="Operations staff" title="Dashboard" />

      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading dashboard...</div>
      ) : (
        <DashboardMetricGrid metrics={metrics} />
      )}
    </section>
  );
}
