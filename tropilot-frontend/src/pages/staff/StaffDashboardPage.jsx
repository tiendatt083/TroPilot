import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as dashboardApi from '../../features/buildings/dashboardApi.js';
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
  const { t } = useTranslation();
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
          setError(apiError.response?.data?.message || t('dashboard.staff.loadError'));
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
  }, [t]);

  const workloadMetrics = dashboard
    ? [
        { label: t('dashboard.staff.metrics.assignedTasks'), value: formatNumber(dashboard.assignedTasks), tone: 'primary', featured: true },
        { label: t('dashboard.staff.metrics.overdueTasks'), value: formatNumber(dashboard.overdueTasks), tone: 'danger' }
      ]
    : [];
  const operationsMetrics = dashboard
    ? [
        { label: t('dashboard.staff.metrics.roomsNeedingUtilityReading'), value: formatNumber(dashboard.roomsNeedingUtilityReading), tone: 'warning' },
        { label: t('dashboard.staff.metrics.pendingPaymentConfirmations'), value: formatNumber(dashboard.pendingPaymentConfirmations), tone: 'warning' },
        { label: t('dashboard.staff.metrics.activeMaintenanceRequests'), value: formatNumber(dashboard.activeMaintenanceRequests), tone: 'primary' }
      ]
    : [];
  const financeMetrics = dashboard
    ? [
        { label: t('dashboard.staff.metrics.createdExpenses'), value: formatNumber(dashboard.createdExpenses), tone: 'primary' }
      ]
    : [];
  const heroMetrics = dashboard
    ? [
        { label: t('dashboard.staff.metrics.assignedTasks'), value: formatNumber(dashboard.assignedTasks) },
        { label: t('dashboard.staff.metrics.overdueTasks'), value: formatNumber(dashboard.overdueTasks) },
        { label: t('dashboard.staff.metrics.utilityReadingsDue'), value: formatNumber(dashboard.roomsNeedingUtilityReading) },
        { label: t('dashboard.staff.metrics.paymentChecks'), value: formatNumber(dashboard.pendingPaymentConfirmations) }
      ]
    : [];

  return (
    <section className="content-section dashboard-page staff-dashboard-page">
      <div className="dashboard-hero">
        <div>
          <PageHeader eyebrow={t('dashboard.staff.eyebrow')} title={t('dashboard.staff.title')} />
          <p>{t('dashboard.staff.heroDescription')}</p>
        </div>
        {dashboard && <DashboardMetricGrid metrics={heroMetrics} compact />}
      </div>

      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('dashboard.staff.loading')}</div>
      ) : (
        <div className="dashboard-section-stack staff-dashboard-grid">
          <DashboardSection
            title={t('dashboard.staff.sections.taskTitle')}
            description={t('dashboard.staff.sections.taskDescription')}
            metrics={workloadMetrics}
          />
          <DashboardSection
            title={t('dashboard.staff.sections.operationsTitle')}
            description={t('dashboard.staff.sections.operationsDescription')}
            metrics={operationsMetrics}
          />
          <DashboardSection
            title={t('dashboard.staff.sections.expenseTitle')}
            description={t('dashboard.staff.sections.expenseDescription')}
            metrics={financeMetrics}
          />
        </div>
      )}
    </section>
  );
}
