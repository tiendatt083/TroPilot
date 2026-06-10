import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as dashboardApi from '../../api/dashboardApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

function toNumber(value) {
  const numberValue = Number(value ?? 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function formatNumber(value, locale = 'en-US') {
  const numberValue = toNumber(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString(locale, { maximumFractionDigits: 2 })
    : value;
}

function getPercent(value, total) {
  const totalValue = toNumber(total);
  if (totalValue <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((toNumber(value) / totalValue) * 100));
}

function getDonutStyle(segments) {
  const total = segments.reduce((sum, segment) => sum + toNumber(segment.value), 0);
  let cursor = 0;
  const stops = segments.map((segment) => {
    const start = cursor;
    cursor += total > 0 ? (toNumber(segment.value) / total) * 360 : 0;
    return `${segment.color} ${start}deg ${cursor}deg`;
  });

  return {
    background: total > 0
      ? `conic-gradient(${stops.join(', ')})`
      : 'conic-gradient(#d9e5ee 0deg 360deg)'
  };
}

function MetricCard({ label, value, helper, tone = 'neutral' }) {
  return (
    <article className={`home-metric-card home-metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {helper && <small>{helper}</small>}
    </article>
  );
}

function DonutPanel({ title, subtitle, totalLabel, totalValue, segments, locale }) {
  return (
    <section className="home-analytics-card">
      <div className="home-panel-title">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      <div className="home-donut-layout">
        <div className="home-donut" style={getDonutStyle(segments)}>
          <div>
            <strong>{totalValue}</strong>
            <span>{totalLabel}</span>
          </div>
        </div>
        <div className="home-chart-legend">
          {segments.map((segment) => (
            <div key={segment.label}>
              <i style={{ backgroundColor: segment.color }} aria-hidden="true" />
              <span>{segment.label}</span>
              <strong>{formatNumber(segment.value, locale)}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BarPanel({ title, subtitle, rows, locale }) {
  const maxValue = Math.max(...rows.map((row) => toNumber(row.value)), 1);

  return (
    <section className="home-analytics-card">
      <div className="home-panel-title">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      <div className="home-bar-list">
        {rows.map((row) => (
          <div className="home-bar-row" key={row.label}>
            <div>
              <span>{row.label}</span>
              <strong>{formatNumber(row.value, locale)}</strong>
            </div>
            <div className="home-bar-track">
              <i
                className={`home-bar-fill home-bar-${row.tone}`}
                style={{ width: `${Math.max(4, getPercent(row.value, maxValue))}%` }}
                aria-hidden="true"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SummaryTable({ title, rows }) {
  return (
    <section className="home-table-card">
      <div className="home-panel-title">
        <h2>{title}</h2>
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>{rows[0]?.columns[0]?.label}</th>
              <th>{rows[0]?.columns[1]?.header}</th>
              <th>{rows[0]?.columns[2]?.header}</th>
              <th>{rows[0]?.columns[3]?.header}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name}>
                <td><strong>{row.name}</strong></td>
                {row.columns.slice(1).map((column) => (
                  <td key={column.label}>
                    <span className="home-table-label">{column.label}</span>
                    <strong>{column.value}</strong>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function AdminDashboardPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';

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

  const todayText = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date());
  const trackedItems = dashboard
    ? toNumber(dashboard.unpaidInvoices)
      + toNumber(dashboard.overdueInvoices)
      + toNumber(dashboard.pendingMaintenanceRequests)
      + toNumber(dashboard.unresolvedFeedbacks)
      + toNumber(dashboard.totalPendingRoomMembers)
    : 0;
  const occupiedPercent = dashboard ? getPercent(dashboard.occupiedRooms, dashboard.totalRooms) : 0;
  const quickMetrics = dashboard
    ? [
        {
          label: t('dashboard.admin.metrics.totalBuildings'),
          value: formatNumber(dashboard.totalBuildings, locale),
          helper: t('dashboard.admin.cards.buildingHelper'),
          tone: 'primary'
        },
        {
          label: t('dashboard.admin.metrics.totalRooms'),
          value: formatNumber(dashboard.totalRooms, locale),
          helper: t('dashboard.admin.cards.roomHelper', { percent: occupiedPercent }),
          tone: 'info'
        },
        {
          label: t('dashboard.admin.metrics.totalOccupants'),
          value: formatNumber(dashboard.totalOccupants, locale),
          helper: t('dashboard.admin.cards.occupantHelper'),
          tone: 'success'
        },
        {
          label: t('dashboard.admin.metrics.unpaidAmount'),
          value: formatNumber(dashboard.unpaidAmount, locale),
          helper: t('dashboard.admin.cards.unpaidHelper'),
          tone: 'warning'
        },
        {
          label: t('dashboard.admin.metrics.activeVehicles'),
          value: formatNumber(dashboard.totalActiveVehicles, locale),
          helper: t('dashboard.admin.cards.vehicleHelper'),
          tone: 'cyan'
        },
        {
          label: t('dashboard.admin.cards.trackedItems'),
          value: formatNumber(trackedItems, locale),
          helper: t('dashboard.admin.cards.trackedHelper'),
          tone: trackedItems > 0 ? 'danger' : 'success'
        }
      ]
    : [];
  const roomSegments = dashboard
    ? [
        { label: t('dashboard.admin.metrics.occupiedRooms'), value: dashboard.occupiedRooms, color: '#10b981' },
        { label: t('dashboard.admin.metrics.emptyRooms'), value: dashboard.emptyRooms, color: '#3b82f6' },
        { label: t('dashboard.admin.metrics.maintenanceRooms'), value: dashboard.maintenanceRooms, color: '#f59e0b' }
      ]
    : [];
  const attentionSegments = dashboard
    ? [
        { label: t('dashboard.admin.metrics.unpaidInvoices'), value: dashboard.unpaidInvoices, color: '#f59e0b' },
        { label: t('dashboard.admin.metrics.overdueInvoices'), value: dashboard.overdueInvoices, color: '#ef4444' },
        { label: t('dashboard.admin.metrics.pendingMaintenance'), value: dashboard.pendingMaintenanceRequests, color: '#14b8a6' },
        { label: t('dashboard.admin.metrics.unresolvedFeedbacks'), value: dashboard.unresolvedFeedbacks, color: '#64748b' }
      ]
    : [];
  const financeRows = dashboard
    ? [
        { label: t('dashboard.admin.metrics.totalIncome'), value: dashboard.totalIncome, tone: 'success' },
        { label: t('dashboard.admin.metrics.unpaidAmount'), value: dashboard.unpaidAmount, tone: 'warning' },
        { label: t('dashboard.admin.metrics.totalExpense'), value: dashboard.totalExpense, tone: 'danger' },
        { label: t('dashboard.admin.metrics.remainingCash'), value: dashboard.remainingCash, tone: 'primary' }
      ]
    : [];
  const summaryRows = dashboard
    ? [
        {
          name: t('dashboard.admin.tables.portfolio'),
          columns: [
            { label: t('dashboard.admin.tables.group'), value: t('dashboard.admin.tables.portfolio') },
            { header: t('dashboard.admin.tables.primary'), label: t('dashboard.admin.metrics.totalBuildings'), value: formatNumber(dashboard.totalBuildings, locale) },
            { header: t('dashboard.admin.tables.secondary'), label: t('dashboard.admin.metrics.totalRooms'), value: formatNumber(dashboard.totalRooms, locale) },
            { header: t('dashboard.admin.tables.tertiary'), label: t('dashboard.admin.metrics.occupiedRooms'), value: formatNumber(dashboard.occupiedRooms, locale) }
          ]
        },
        {
          name: t('dashboard.admin.tables.residents'),
          columns: [
            { label: t('dashboard.admin.tables.group'), value: t('dashboard.admin.tables.residents') },
            { header: t('dashboard.admin.tables.primary'), label: t('dashboard.admin.metrics.headResidents'), value: formatNumber(dashboard.totalHeadResidents, locale) },
            { header: t('dashboard.admin.tables.secondary'), label: t('dashboard.admin.metrics.approvedRoomMembers'), value: formatNumber(dashboard.totalApprovedRoomMembers, locale) },
            { header: t('dashboard.admin.tables.tertiary'), label: t('dashboard.admin.metrics.pendingRoomMembers'), value: formatNumber(dashboard.totalPendingRoomMembers, locale) }
          ]
        },
        {
          name: t('dashboard.admin.tables.finance'),
          columns: [
            { label: t('dashboard.admin.tables.group'), value: t('dashboard.admin.tables.finance') },
            { header: t('dashboard.admin.tables.primary'), label: t('dashboard.admin.metrics.totalIncome'), value: formatNumber(dashboard.totalIncome, locale) },
            { header: t('dashboard.admin.tables.secondary'), label: t('dashboard.admin.metrics.totalExpense'), value: formatNumber(dashboard.totalExpense, locale) },
            { header: t('dashboard.admin.tables.tertiary'), label: t('dashboard.admin.metrics.remainingCash'), value: formatNumber(dashboard.remainingCash, locale) }
          ]
        },
        {
          name: t('dashboard.admin.tables.operations'),
          columns: [
            { label: t('dashboard.admin.tables.group'), value: t('dashboard.admin.tables.operations') },
            { header: t('dashboard.admin.tables.primary'), label: t('dashboard.admin.metrics.expiringContracts'), value: formatNumber(dashboard.expiringContracts, locale) },
            { header: t('dashboard.admin.tables.secondary'), label: t('dashboard.admin.metrics.pendingMaintenance'), value: formatNumber(dashboard.pendingMaintenanceRequests, locale) },
            { header: t('dashboard.admin.tables.tertiary'), label: t('dashboard.admin.metrics.inProgressTasks'), value: formatNumber(dashboard.inProgressTasks, locale) }
          ]
        }
      ]
    : [];

  return (
    <section className="content-section dashboard-page admin-home-page">
      <div className="admin-home-hero">
        <div>
          <PageHeader eyebrow={t('dashboard.admin.eyebrow')} title={t('dashboard.admin.title')} />
          <p>{t('dashboard.admin.heroDescription', { name: user?.fullName || 'Admin' })}</p>
        </div>
        <div className="admin-home-date-card">
          <span>{t('dashboard.admin.today')}</span>
          <strong>{todayText}</strong>
          {dashboard && <small>{t('dashboard.admin.trackedItems', { count: formatNumber(trackedItems, locale) })}</small>}
        </div>
      </div>

      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('dashboard.admin.loading')}</div>
      ) : !dashboard ? (
        <div className="empty-state">{t('dashboard.admin.loadError')}</div>
      ) : (
        <div className="admin-home-workspace">
          <section className="admin-home-overview-card">
            <div className="home-panel-title">
              <div>
                <span>{t('dashboard.admin.sections.todayLabel')}</span>
                <h2>{t('dashboard.admin.sections.todayTitle')}</h2>
              </div>
              <strong>{t('dashboard.admin.sections.trackingCount', { count: formatNumber(trackedItems, locale) })}</strong>
            </div>
            <div className="admin-home-metrics">
              {quickMetrics.map((metric) => (
                <MetricCard key={metric.label} {...metric} />
              ))}
            </div>
          </section>

          <div className="admin-home-chart-grid">
            <DonutPanel
              title={t('dashboard.admin.sections.roomStatusTitle')}
              subtitle={t('dashboard.admin.sections.roomStatusDescription')}
              totalLabel={t('dashboard.admin.metrics.rooms')}
              totalValue={formatNumber(dashboard.totalRooms, locale)}
              segments={roomSegments}
              locale={locale}
            />
            <DonutPanel
              title={t('dashboard.admin.sections.attentionTitle')}
              subtitle={t('dashboard.admin.sections.attentionDescription')}
              totalLabel={t('dashboard.admin.cards.trackedItems')}
              totalValue={formatNumber(trackedItems, locale)}
              segments={attentionSegments}
              locale={locale}
            />
          </div>

          <div className="admin-home-chart-grid">
            <BarPanel
              title={t('dashboard.admin.sections.financeTitle')}
              subtitle={t('dashboard.admin.sections.financeDescription')}
              rows={financeRows}
              locale={locale}
            />
            <SummaryTable
              title={t('dashboard.admin.sections.summaryTitle')}
              rows={summaryRows}
            />
          </div>
        </div>
      )}
    </section>
  );
}
