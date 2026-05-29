import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
          setError(apiError.response?.data?.message || t('dashboard.admin.loadError'));
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

  const portfolioMetrics = dashboard
    ? [
        { label: t('dashboard.admin.metrics.totalBuildings'), value: formatNumber(dashboard.totalBuildings), tone: 'primary' },
        { label: t('dashboard.admin.metrics.totalRooms'), value: formatNumber(dashboard.totalRooms), tone: 'primary' },
        { label: t('dashboard.admin.metrics.occupiedRooms'), value: formatNumber(dashboard.occupiedRooms), tone: 'success' },
        { label: t('dashboard.admin.metrics.emptyRooms'), value: formatNumber(dashboard.emptyRooms) },
        { label: t('dashboard.admin.metrics.maintenanceRooms'), value: formatNumber(dashboard.maintenanceRooms), tone: 'warning' }
      ]
    : [];
  const residentMetrics = dashboard
    ? [
        { label: t('dashboard.admin.metrics.headResidents'), value: formatNumber(dashboard.totalHeadResidents), tone: 'primary' },
        { label: t('dashboard.admin.metrics.approvedRoomMembers'), value: formatNumber(dashboard.totalApprovedRoomMembers) },
        { label: t('dashboard.admin.metrics.pendingRoomMembers'), value: formatNumber(dashboard.totalPendingRoomMembers), tone: 'warning' },
        { label: t('dashboard.admin.metrics.totalOccupants'), value: formatNumber(dashboard.totalOccupants), tone: 'success' },
        { label: t('dashboard.admin.metrics.activeVehicles'), value: formatNumber(dashboard.totalActiveVehicles) }
      ]
    : [];
  const financeMetrics = dashboard
    ? [
        { label: t('dashboard.admin.metrics.totalIncome'), value: formatNumber(dashboard.totalIncome), tone: 'success', featured: true },
        { label: t('dashboard.admin.metrics.totalExpense'), value: formatNumber(dashboard.totalExpense), tone: 'danger' },
        { label: t('dashboard.admin.metrics.remainingCash'), value: formatNumber(dashboard.remainingCash), tone: 'primary', featured: true },
        { label: t('dashboard.admin.metrics.unpaidAmount'), value: formatNumber(dashboard.unpaidAmount), tone: 'warning' }
      ]
    : [];
  const attentionMetrics = dashboard
    ? [
        {
          label: t('dashboard.admin.metrics.expiringContracts'),
          value: formatNumber(dashboard.expiringContracts),
          note: t('dashboard.admin.notes.next30Days'),
          tone: 'warning'
        },
        { label: t('dashboard.admin.metrics.unpaidInvoices'), value: formatNumber(dashboard.unpaidInvoices), tone: 'warning' },
        { label: t('dashboard.admin.metrics.overdueInvoices'), value: formatNumber(dashboard.overdueInvoices), tone: 'danger' },
        { label: t('dashboard.admin.metrics.pendingMaintenance'), value: formatNumber(dashboard.pendingMaintenanceRequests), tone: 'warning' },
        { label: t('dashboard.admin.metrics.inProgressTasks'), value: formatNumber(dashboard.inProgressTasks), tone: 'primary' },
        { label: t('dashboard.admin.metrics.unresolvedFeedbacks'), value: formatNumber(dashboard.unresolvedFeedbacks), tone: 'warning' }
      ]
    : [];
  const heroMetrics = dashboard
    ? [
        { label: t('dashboard.admin.metrics.buildings'), value: formatNumber(dashboard.totalBuildings) },
        { label: t('dashboard.admin.metrics.rooms'), value: formatNumber(dashboard.totalRooms) },
        { label: t('dashboard.admin.metrics.openIssues'), value: formatNumber((dashboard.pendingMaintenanceRequests || 0) + (dashboard.unresolvedFeedbacks || 0)) },
        { label: t('dashboard.admin.metrics.cashPosition'), value: formatNumber(dashboard.remainingCash) }
      ]
    : [];

  return (
    <section className="content-section dashboard-page">
      <div className="dashboard-hero">
        <div>
          <PageHeader eyebrow={t('dashboard.admin.eyebrow')} title={t('dashboard.admin.title')} />
          <p>{t('dashboard.admin.heroDescription')}</p>
        </div>
        {dashboard && <DashboardMetricGrid metrics={heroMetrics} compact />}
      </div>

      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('dashboard.admin.loading')}</div>
      ) : (
        <div className="dashboard-section-stack">
          <DashboardSection
            title={t('dashboard.admin.sections.portfolioTitle')}
            description={t('dashboard.admin.sections.portfolioDescription')}
            metrics={portfolioMetrics}
          />
          <DashboardSection
            title={t('dashboard.admin.sections.residentsTitle')}
            description={t('dashboard.admin.sections.residentsDescription')}
            metrics={residentMetrics}
          />
          <DashboardSection
            title={t('dashboard.admin.sections.financeTitle')}
            description={t('dashboard.admin.sections.financeDescription')}
            metrics={financeMetrics}
          />
          <DashboardSection
            title={t('dashboard.admin.sections.attentionTitle')}
            description={t('dashboard.admin.sections.attentionDescription')}
            metrics={attentionMetrics}
          />
        </div>
      )}
    </section>
  );
}
