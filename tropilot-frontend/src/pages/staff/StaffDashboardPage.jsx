import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as dashboardApi from '../../features/buildings/dashboardApi.js';
import LineIcon from '../../components/common/LineIcon.jsx';
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
  const overviewMetrics = dashboard
    ? [...workloadMetrics, ...operationsMetrics, ...financeMetrics]
    : [];
  const priorityItems = dashboard
    ? [
        {
          icon: 'clock',
          label: t('dashboard.staff.metrics.overdueTasks'),
          value: formatNumber(dashboard.overdueTasks),
          helper: t('dashboard.staff.quick.taskHelper'),
          to: '/staff/tasks',
          tone: 'danger'
        },
        {
          icon: 'activity',
          label: t('dashboard.staff.metrics.utilityReadingsDue'),
          value: formatNumber(dashboard.roomsNeedingUtilityReading),
          helper: t('dashboard.staff.quick.utilityHelper'),
          to: '/staff/utility-readings',
          tone: 'warning'
        },
        {
          icon: 'wallet',
          label: t('dashboard.staff.metrics.paymentChecks'),
          value: formatNumber(dashboard.pendingPaymentConfirmations),
          helper: t('dashboard.staff.quick.paymentHelper'),
          to: '/staff/payments/pending',
          tone: 'warning'
        },
        {
          icon: 'tool',
          label: t('dashboard.staff.metrics.activeMaintenanceRequests'),
          value: formatNumber(dashboard.activeMaintenanceRequests),
          helper: t('dashboard.staff.quick.maintenanceHelper'),
          to: '/staff/maintenance',
          tone: 'primary'
        }
      ]
    : [];
  const quickActions = [
    { icon: 'checkShield', label: t('dashboard.staff.quick.tasks'), to: '/staff/tasks' },
    { icon: 'activity', label: t('dashboard.staff.quick.utilityReadings'), to: '/staff/utility-readings' },
    { icon: 'wallet', label: t('dashboard.staff.quick.payments'), to: '/staff/payments/pending' },
    { icon: 'tool', label: t('dashboard.staff.quick.maintenance'), to: '/staff/maintenance' },
    { icon: 'fileText', label: t('dashboard.staff.quick.expenses'), to: '/staff/expenses' }
  ];

  return (
    <section className="content-section dashboard-page staff-dashboard-page">
      <div className="dashboard-hero staff-dashboard-hero">
        <div className="staff-dashboard-hero-copy">
          <PageHeader eyebrow={t('dashboard.staff.eyebrow')} title={t('dashboard.staff.title')} />
          <p>{t('dashboard.staff.heroDescription')}</p>
        </div>
      </div>

      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state staff-dashboard-loading">{t('dashboard.staff.loading')}</div>
      ) : (
        <div className="staff-dashboard-workspace">
          <section className="staff-priority-panel">
            <div className="dashboard-section-header">
              <div>
                <h2>{t('dashboard.staff.sections.priorityTitle')}</h2>
                <p>{t('dashboard.staff.sections.priorityDescription')}</p>
              </div>
            </div>
            <div className="staff-priority-grid">
              {priorityItems.map((item) => (
                <Link className={`staff-priority-card staff-priority-card-${item.tone}`} key={item.label} to={item.to}>
                  <span className="staff-priority-icon">
                    <LineIcon name={item.icon} />
                  </span>
                  <div>
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                    <small>{item.helper}</small>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <div className="staff-dashboard-grid">
            <section className="staff-workload-panel">
              <div className="dashboard-section-header">
                <div>
                  <h2>{t('dashboard.staff.sections.taskTitle')}</h2>
                  <p>{t('dashboard.staff.sections.taskDescription')}</p>
                </div>
              </div>
              <div className="staff-workload-list">
                {overviewMetrics.map((metric) => (
                  <div className={`staff-workload-row staff-workload-row-${metric.tone || 'primary'}`} key={metric.label}>
                    <span>{metric.label}</span>
                    <strong>{metric.value}</strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="staff-quick-actions-panel">
              <div>
                <h2>{t('dashboard.staff.sections.quickActionTitle')}</h2>
                <p>{t('dashboard.staff.sections.quickActionDescription')}</p>
              </div>
              <div className="staff-quick-action-list">
                {quickActions.map((action) => (
                  <Link className="staff-quick-action" key={action.to} to={action.to}>
                    <LineIcon name={action.icon} />
                    <span>{action.label}</span>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}
    </section>
  );
}
